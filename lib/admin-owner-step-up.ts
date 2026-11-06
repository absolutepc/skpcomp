import {issueOwnerStepUpGrantAfterVerifiedAssertion} from './admin-owner-step-up-grants';
import {verifyAuthenticationResponse} from '@simplewebauthn/server';
import type {AuthenticationResponseJSON} from '@simplewebauthn/server';
import {adminWebAuthnConfig} from './admin-passkey-config';
import {consumeWebAuthnChallenge} from './admin-webauthn-challenges';
import {findActiveAdminPasskey,advanceVerifiedPasskeyCounter} from './admin-passkey-credentials';
import {adminTransaction,storeEnv} from '../db/platform-store';
import {activeOwnerSessionBinding} from './vercel-admin-session';
import type {OwnerStepUpAction} from './admin-owner-step-up-grants';

/** Bind each authentication challenge to the exact owner browser session. */
export const ownerStepUpContext=(ownerId:string,sessionHash:string,action:OwnerStepUpAction)=>'owner-step-up:'+ownerId+':'+sessionHash+':'+action;

/** Step-up proof must use an already registered credential owned by this
 * active owner. The one-time challenge is bound to the owner identity.
 * Does not grant a new admin session.
 */
export async function verifyOwnerStepUp(input:{
 request:Request;challenge:string;response:AuthenticationResponseJSON;origin:string;action:OwnerStepUpAction;
}):Promise<boolean>{
 if(!/^[a-f0-9]{64}$/.test(input.challenge)||!input.response||
  typeof input.response.id!=='string')return false;
 const binding=await activeOwnerSessionBinding(input.request);
 if(!binding)return false;
 const ownerId=binding.ownerId;
 const config=adminWebAuthnConfig(input.origin);
 const stored=await findActiveAdminPasskey(input.response.id);
 if(!stored)return false;
 const {DB}=await storeEnv();
 const owned=await DB.prepare(`SELECT 1 AS valid FROM skp_admin_passkeys p
 JOIN skp_admin_users u ON u.id=p.user_id
 WHERE p.credential_id=? AND p.user_id=?::uuid AND p.revoked_at IS NULL
 AND u.role='owner' AND u.status='active'`)
 .bind(stored.credential_id,ownerId).first();
 if(!owned)return false;
 const verification=await verifyAuthenticationResponse({
  response:input.response,
  expectedChallenge:Buffer.from(input.challenge,'hex').toString('base64url'),
  expectedOrigin:config.origin,expectedRPID:config.rpID,
  requireUserVerification:true,
  credential:{id:stored.credential_id,publicKey:Uint8Array.from(stored.public_key),
   counter:stored.counter,transports:stored.transports as ('usb'|'nfc'|'ble'|'internal'|'hybrid')[]},
 });
 if(!verification.verified)return false;
 try{return await adminTransaction(async()=>{
  const owner=await DB.prepare("SELECT id FROM skp_admin_users WHERE id=?::uuid AND role='owner' AND status='active' FOR UPDATE")
   .bind(ownerId).first();
  const current=await activeOwnerSessionBinding(input.request);
  if(!owner||!current||current.ownerId!==ownerId||current.sessionHash!==binding.sessionHash)throw new Error('Owner session invalid');
  if(!await consumeWebAuthnChallenge(input.challenge,'authenticate',ownerStepUpContext(ownerId,binding.sessionHash,input.action)))throw new Error('Step-up challenge invalid');
  if(!await advanceVerifiedPasskeyCounter(stored.credential_id,stored.counter,verification.authenticationInfo.newCounter))throw new Error('Passkey counter update failed');
  if(input.action!=='owner-passkey-test'&&!await issueOwnerStepUpGrantAfterVerifiedAssertion(input.request,input.action,stored.credential_id))throw new Error('Grant issuance failed');
  return true;
 });}catch{return false}
}
