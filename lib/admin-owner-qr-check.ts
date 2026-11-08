import {createHash} from 'node:crypto';
import {verifyAuthenticationResponse} from '@simplewebauthn/server';
import type {AuthenticationResponseJSON} from '@simplewebauthn/server';
import {storeEnv,adminTransaction} from '../db/platform-store';
import {activeOwnerSessionBinding} from './vercel-admin-session';
import {newQrChallenge,qrChallengeHash} from './admin-qr-challenge';
import {issueWebAuthnChallenge,consumeWebAuthnChallenge} from './admin-webauthn-challenges';
import {findActiveAdminPasskey,advanceVerifiedPasskeyCounter} from './admin-passkey-credentials';
import {adminWebAuthnConfig} from './admin-passkey-config';

const tokenPattern=/^[a-f0-9]{64}$/;
export async function createOwnerQrCheck(request:Request,fingerprint:string){
 if(!/^[a-f0-9]{32}$/.test(fingerprint))throw Error('Invalid fingerprint');
 const binding=await activeOwnerSessionBinding(request);
 if(!binding)throw Error('Owner session required');
 const {DB}=await storeEnv();
 const key=await DB.prepare("SELECT 1 AS valid FROM skp_admin_passkeys WHERE user_id=?::uuid AND md5(credential_id)=? AND revoked_at IS NULL").bind(binding.ownerId,fingerprint).first();
 if(!key)throw Error('Key unavailable');
 const requestToken=newQrChallenge(),desktopSecret=newQrChallenge();
 const requestHash=await qrChallengeHash(requestToken);
 const expiresAt=Math.floor(Date.now()/1000)+120;
 await DB.prepare(`INSERT INTO skp_admin_owner_qr_checks
 (request_hash,desktop_secret_hash,owner_user_id,session_token_hash,credential_fingerprint,expires_at)
 VALUES (?,?,?::uuid,?,?,to_timestamp(?))`)
 .bind(requestHash,await qrChallengeHash(desktopSecret),binding.ownerId,binding.sessionHash,fingerprint,expiresAt).run();
 return {requestToken,desktopSecret,expiresAt,approvalUrl:new URL('/admin/security/approve?request='+requestToken,request.url).toString()};
}
export async function ownerQrStatus(request:Request,requestToken:string,desktopSecret:string){
 if(!tokenPattern.test(requestToken)||!tokenPattern.test(desktopSecret))throw Error('Invalid request');
 const binding=await activeOwnerSessionBinding(request);
 if(!binding)throw Error('Owner session required');
 const {DB}=await storeEnv();
 const row=await DB.prepare(`SELECT status FROM skp_admin_owner_qr_checks
 WHERE request_hash=? AND desktop_secret_hash=? AND owner_user_id=?::uuid AND session_token_hash=?
 AND expires_at>now()`)
 .bind(await qrChallengeHash(requestToken),await qrChallengeHash(desktopSecret),binding.ownerId,binding.sessionHash).first<{status:string}>();
 return row?.status??'expired';
}
export async function ownerQrOptions(requestToken:string,origin:string){
 if(!tokenPattern.test(requestToken))throw Error('Invalid request');
 const {DB}=await storeEnv();
 const requestHash=await qrChallengeHash(requestToken);
 const row=await DB.prepare(`SELECT q.owner_user_id,q.credential_fingerprint,p.credential_id
 FROM skp_admin_owner_qr_checks q JOIN skp_admin_passkeys p
 ON p.user_id=q.owner_user_id AND md5(p.credential_id)=q.credential_fingerprint AND p.revoked_at IS NULL
 JOIN skp_admin_users u ON u.id=q.owner_user_id AND u.role='owner' AND u.status='active'
 JOIN skp_admin_sessions_v2 s ON s.token_hash=q.session_token_hash AND s.user_id=q.owner_user_id AND s.expires>extract(epoch from now())
 WHERE q.request_hash=? AND q.status='pending' AND q.expires_at>now()`)
 .bind(requestHash).first<{owner_user_id:string;credential_fingerprint:string;credential_id:string}>();
 if(!row)throw Error('Request expired');
 const {challenge}=await issueWebAuthnChallenge('authenticate','owner-qr-check:'+requestHash);
 const {rpID}=adminWebAuthnConfig(origin);
 return {challenge,rpID,userVerification:'required',timeout:90000};
}
export async function completeOwnerQrCheck(requestToken:string,challenge:string,response:AuthenticationResponseJSON,origin:string){
 if(!tokenPattern.test(requestToken)||!tokenPattern.test(challenge)||!response?.id)return false;
 const requestHash=await qrChallengeHash(requestToken);
 const {DB}=await storeEnv();
 const row=await DB.prepare(`SELECT q.owner_user_id,q.credential_fingerprint
 FROM skp_admin_owner_qr_checks q JOIN skp_admin_users u ON u.id=q.owner_user_id
 JOIN skp_admin_sessions_v2 s ON s.token_hash=q.session_token_hash AND s.user_id=q.owner_user_id AND s.expires>extract(epoch from now())
 WHERE q.request_hash=? AND q.status='pending' AND q.expires_at>now()
 AND u.role='owner' AND u.status='active'`)
 .bind(requestHash).first<{owner_user_id:string;credential_fingerprint:string}>();
 if(!row)return false;
 const stored=await findActiveAdminPasskey(response.id);
 if(!stored||createHash('md5').update(stored.credential_id).digest('hex')!==row.credential_fingerprint)return false;
 const owner=await DB.prepare("SELECT 1 AS valid FROM skp_admin_passkeys WHERE credential_id=? AND user_id=?::uuid AND revoked_at IS NULL").bind(stored.credential_id,row.owner_user_id).first();
 if(!owner)return false;
 const config=adminWebAuthnConfig(origin);
 const verification=await verifyAuthenticationResponse({
  response,expectedChallenge:Buffer.from(challenge,'hex').toString('base64url'),
  expectedOrigin:config.origin,expectedRPID:config.rpID,requireUserVerification:true,
  credential:{id:stored.credential_id,publicKey:Uint8Array.from(stored.public_key),counter:stored.counter,
   transports:stored.transports as ('usb'|'nfc'|'ble'|'internal'|'hybrid')[]}
 });
 if(!verification.verified)return false;
 try{return await adminTransaction(async()=>{
  const locked=await DB.prepare(`SELECT q.request_hash FROM skp_admin_owner_qr_checks q
 JOIN skp_admin_sessions_v2 s ON s.token_hash=q.session_token_hash AND s.user_id=q.owner_user_id AND s.expires>extract(epoch from now())
 WHERE q.request_hash=? AND q.status='pending' AND q.expires_at>now() AND q.owner_user_id=?::uuid
 FOR UPDATE OF q`).bind(requestHash,row.owner_user_id).first();
  if(!locked)throw Error('Request unavailable');
  if(!await consumeWebAuthnChallenge(challenge,'authenticate','owner-qr-check:'+requestHash))throw Error('Challenge invalid');
  if(!await advanceVerifiedPasskeyCounter(stored.credential_id,stored.counter,verification.authenticationInfo.newCounter))throw Error('Counter invalid');
  const updated=await DB.prepare("UPDATE skp_admin_owner_qr_checks SET status='approved',approved_at=now() WHERE request_hash=? AND status='pending' AND expires_at>now() RETURNING request_hash").bind(requestHash).first();
  if(!updated)throw Error('Already completed');
  return true;
 });}catch{return false;}
}
