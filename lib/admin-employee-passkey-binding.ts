import {createHash} from 'node:crypto';
import {isPostgres,storeEnv} from '../db/platform-store';
import type {VerifiedPasskeyRegistration} from './admin-passkey-enrollment-store';

const inviteHash=(token:string)=>createHash('sha256').update('skp-employee-invite-v1:').update(token).digest('hex');

/** Store a previously cryptographically verified WebAuthn credential.
 * Invite consumption, employee status check and credential binding are
 * one SQL statement. The invite is never accepted as a login credential.
 * The caller must first verify WebAuthn origin, RP ID, UV and challenge.
 */
export async function consumeInvitationForVerifiedPasskey(
 token:string,verified:VerifiedPasskeyRegistration
):Promise<boolean>{
 if(!isPostgres()||!/^[a-f0-9]{64}$/.test(token))return false;
 const {credentialId,publicKey,counter,transports}=verified;
 if(!credentialId||credentialId.length>2048||
  !(publicKey instanceof Uint8Array)||publicKey.length<16||publicKey.length>4096||
  !Number.isSafeInteger(counter)||counter<0||
  !Array.isArray(transports)||transports.length>8||
  !transports.every(v=>typeof v==='string'&&v.length<=64))return false;
 const {DB}=await storeEnv();
 const row=await DB.prepare(`WITH eligible AS (
   SELECT i.id,i.user_id FROM skp_admin_employee_invites i
   JOIN skp_admin_users u ON u.id=i.user_id
   WHERE i.token_hash=? AND i.consumed_at IS NULL AND i.revoked_at IS NULL
    AND i.expires_at>now() AND u.status='active' AND u.role IN ('owner','admin')
 ), consumed AS (
   UPDATE skp_admin_employee_invites i SET consumed_at=now()
   FROM eligible e WHERE i.id=e.id AND i.consumed_at IS NULL
   RETURNING i.user_id
 ), registered AS (
   INSERT INTO skp_admin_passkeys
    (credential_id,public_key,counter,transports,device_label,user_id)
   SELECT ?,?,?,?::jsonb,?,c.user_id FROM consumed c
   RETURNING credential_id,user_id
 ), audit AS (
   INSERT INTO skp_admin_security_events(target_user_id,event_type)
   SELECT user_id,'passkey_registered' FROM registered RETURNING id
 )
 SELECT credential_id,(SELECT count(*) FROM audit) AS audit_count FROM registered`)
  .bind(inviteHash(token),credentialId,publicKey,counter,
   JSON.stringify(transports),(verified.deviceLabel||'').trim().slice(0,100))
  .first<{credential_id:string;audit_count:number}>();
 return !!row;
}
