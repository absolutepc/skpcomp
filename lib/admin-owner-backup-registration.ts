import {consumeSessionOwnerStepUpGrantInTransaction} from './admin-owner-step-up-grants';
import {verifyRegistrationResponse} from '@simplewebauthn/server';
import type {RegistrationResponseJSON} from '@simplewebauthn/server';
import {adminWebAuthnConfig} from './admin-passkey-config';
import {consumeWebAuthnChallenge} from './admin-webauthn-challenges';
import {adminTransaction,isPostgres,storeEnv} from '../db/platform-store';
import {activeOwnerSessionBinding} from './vercel-admin-session';

export const ownerBackupChallengeContext=(ownerId:string,sessionHash:string):string=>'owner-backup:'+ownerId+':'+sessionHash;

/** Complete owner backup enrollment only after cryptographic attestation and
 * a fresh owner session check under a database row lock.
 * A valid session alone is NOT sufficient for production-grade step-up:
 * deploy only after independent recent owner reauthentication is added.
 */
export async function completeOwnerBackupPasskey(input:{
 request:Request;challenge:string;response:RegistrationResponseJSON;
 origin:string;deviceLabel?:string;
}):Promise<boolean>{
 if(!isPostgres()||!/^[a-f0-9]{64}$/.test(input.challenge)||
  !input.response||typeof input.response.id!=='string')return false;
 const binding=await activeOwnerSessionBinding(input.request);
 if(!binding)return false;
 const ownerId=binding.ownerId;
 const config=adminWebAuthnConfig(input.origin);
 const verified=await verifyRegistrationResponse({
  response:input.response,
  expectedChallenge:Buffer.from(input.challenge,'hex').toString('base64url'),
  expectedOrigin:config.origin,expectedRPID:config.rpID,
  requireUserVerification:true,
 });
 if(!verified.verified||!verified.registrationInfo)return false;
 const {credential}=verified.registrationInfo;
 if(!credential.id||credential.id.length>2048||
  credential.publicKey.length<16||credential.publicKey.length>4096||
  !Number.isSafeInteger(credential.counter)||credential.counter<0||
  (credential.transports||[]).length>8)return false;
 try {
  return await adminTransaction(async()=>{
  const {DB}=await storeEnv();
  const owner=await DB.prepare("SELECT id FROM skp_admin_users WHERE id=?::uuid AND role='owner' AND status='active' FOR UPDATE")
   .bind(ownerId).first();
  const current=await activeOwnerSessionBinding(input.request);
  if(!owner||!current||current.ownerId!==ownerId||current.sessionHash!==binding.sessionHash)throw new Error('Owner session invalid');
  if(!await consumeSessionOwnerStepUpGrantInTransaction(input.request,'owner-passkey-enroll'))throw new Error('Step-up grant invalid');
  if(!await consumeWebAuthnChallenge(input.challenge,'register',ownerBackupChallengeContext(ownerId,binding.sessionHash)))throw new Error('Challenge invalid');
  const row=await DB.prepare(`WITH registered AS (
   INSERT INTO skp_admin_passkeys
    (credential_id,public_key,counter,transports,device_label,user_id)
   VALUES (?,?,?,?::jsonb,?,?::uuid)
   ON CONFLICT (credential_id) DO NOTHING
   RETURNING user_id
  ), audit AS (
   INSERT INTO skp_admin_security_events(actor_user_id,target_user_id,event_type)
   SELECT user_id,user_id,'passkey_registered' FROM registered RETURNING id
  ) SELECT (SELECT count(*) FROM registered) AS registered,
    (SELECT count(*) FROM audit) AS audited`)
   .bind(credential.id,Uint8Array.from(credential.publicKey),credential.counter,
    JSON.stringify(credential.transports||[]),(input.deviceLabel||'').trim().slice(0,100),ownerId)
   .first<{registered:string|number;audited:string|number}>();
  if(Number(row?.registered)!==1||Number(row?.audited)!==1)throw new Error('Registration incomplete');
  return true;
  });
 } catch { return false; }
}
