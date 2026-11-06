import {verifyAuthenticationResponse} from '@simplewebauthn/server';
import type {AuthenticationResponseJSON} from '@simplewebauthn/server';
import {adminWebAuthnConfig} from './admin-passkey-config';
import {consumeWebAuthnChallenge} from './admin-webauthn-challenges';
import {findActiveAdminPasskey,advanceVerifiedPasskeyCounter} from './admin-passkey-credentials';
import {adminTransaction,storeEnv} from '../db/platform-store';
import {activeSessionOwnerId} from './vercel-admin-session';

/** Step-up proof must use an already registered credential owned by this
 * active owner. The one-time challenge is bound to the owner identity.
 * Does not grant a new admin session.
 */
export async function verifyOwnerStepUp(input:{
 request:Request;challenge:string;response:AuthenticationResponseJSON;origin:string;
}):Promise<boolean>{
 if(!/^[a-f0-9]{64}$/.test(input.challenge)||!input.response||
  typeof input.response.id!=='string')return false;
 const ownerId=await activeSessionOwnerId(input.request);
 if(!ownerId)return false;
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
 return adminTransaction(async()=>{
  const owner=await DB.prepare("SELECT id FROM skp_admin_users WHERE id=?::uuid AND role='owner' AND status='active' FOR UPDATE")
   .bind(ownerId).first();
  if(!owner||await activeSessionOwnerId(input.request)!==ownerId)return false;
  if(!await consumeWebAuthnChallenge(input.challenge,'authenticate','owner-step-up:'+ownerId))return false;
  return advanceVerifiedPasskeyCounter(stored.credential_id,stored.counter,verification.authenticationInfo.newCounter);
 });
}
