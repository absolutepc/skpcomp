import {randomBytes,createHash} from 'node:crypto';
import {adminTransaction,isPostgres,storeEnv} from '../db/platform-store';
import {activeOwnerSessionBinding} from './vercel-admin-session';

export type OwnerStepUpAction='owner-passkey-enroll'|'owner-passkey-revoke'|'owner-passkey-test';
const actions:OwnerStepUpAction[]=['owner-passkey-enroll','owner-passkey-revoke'];
const digest=(token:string)=>createHash('sha256').update('skp-owner-step-up-v1:'+token).digest('hex');

/**
 * Internal persistence primitive, NOT an authorization endpoint.
 * Caller MUST first verify a fresh owner WebAuthn assertion (signature,
 * challenge, UV, RP ID and origin) before calling this function.
 * The returned token must stay server-side and must not be sent as a
 * recovery credential or included in a URL, cookie or log.
 */
export async function issueOwnerStepUpGrantAfterVerifiedAssertion(
 request:Request,action:OwnerStepUpAction,credentialId:string
):Promise<string|null>{
 if(!isPostgres()||!actions.includes(action)||!credentialId||credentialId.length>2048)return null;
 const binding=await activeOwnerSessionBinding(request);
 if(!binding)return null;
 const token=randomBytes(32).toString('hex');
 const {DB}=await storeEnv();
 const row=await DB.prepare(`INSERT INTO skp_admin_owner_step_up_grants
 (grant_hash,owner_user_id,session_token_hash,action,expires_at,verified_credential_id)
 SELECT ?,u.id,s.token_hash,?,now()+interval '2 minutes',p.credential_id
 FROM skp_admin_sessions_v2 s JOIN skp_admin_users u ON u.id=s.user_id
 JOIN skp_admin_passkeys p ON p.user_id=u.id AND p.credential_id=? AND p.revoked_at IS NULL
 WHERE s.token_hash=? AND s.expires>extract(epoch from now())
 AND u.id=?::uuid AND u.role='owner' AND u.status='active'
 RETURNING grant_hash`)
 .bind(digest(token),action,credentialId,binding.sessionHash,binding.ownerId)
 .first<{grant_hash:string}>();
 return row?token:null;
}

/**
 * Call INSIDE the same adminTransaction as the privileged mutation.
 * The caller must lock the owner row before invoking this helper.
 * If the mutation fails, transaction rollback restores the grant.
 */
export async function consumeOwnerStepUpGrantInTransaction(
 request:Request,token:string,action:OwnerStepUpAction
):Promise<boolean>{
 if(!isPostgres()||!actions.includes(action)||!/^[a-f0-9]{64}$/.test(token))return false;
 const binding=await activeOwnerSessionBinding(request);
 if(!binding)return false;
 const {DB}=await storeEnv();
 const row=await DB.prepare(`UPDATE skp_admin_owner_step_up_grants g
 SET consumed_at=now()
 WHERE g.grant_hash=? AND g.owner_user_id=?::uuid
 AND g.session_token_hash=? AND g.action=?
 AND EXISTS (SELECT 1 FROM skp_admin_passkeys p WHERE p.credential_id=g.verified_credential_id AND p.user_id=g.owner_user_id AND p.revoked_at IS NULL)
 AND g.consumed_at IS NULL AND g.expires_at>now()
 RETURNING grant_hash`)
 .bind(digest(token),binding.ownerId,binding.sessionHash,action)
 .first<{grant_hash:string}>();
 return !!row;
}

/** The grant is a server-side authorization record, not a browser bearer token.
 * Only a currently authenticated owner in the SAME session can use it.
 */
export async function hasRecentOwnerStepUpGrant(request:Request,action:OwnerStepUpAction):Promise<boolean>{
 if(!isPostgres()||!actions.includes(action))return false;
 const binding=await activeOwnerSessionBinding(request);
 if(!binding)return false;
 const {DB}=await storeEnv();
 const row=await DB.prepare(`SELECT 1 AS valid FROM skp_admin_owner_step_up_grants g
 WHERE owner_user_id=?::uuid AND session_token_hash=? AND action=?
 AND consumed_at IS NULL AND expires_at>now()
 AND EXISTS (SELECT 1 FROM skp_admin_passkeys p WHERE p.credential_id=g.verified_credential_id AND p.user_id=g.owner_user_id AND p.revoked_at IS NULL) LIMIT 1`)
 .bind(binding.ownerId,binding.sessionHash,action).first();
 return !!row;
}

/** Must be invoked within the transaction that inserts or revokes a key.
 * Consume exactly one grant; concurrent attempts cannot reuse the same row.
 */
export async function consumeSessionOwnerStepUpGrantInTransaction(
 request:Request,action:OwnerStepUpAction,excludedFingerprint:string|null=null
):Promise<boolean>{
 if(!isPostgres()||!actions.includes(action))return false;
 const binding=await activeOwnerSessionBinding(request);
 if(!binding)return false;
 const {DB}=await storeEnv();
 const row=await DB.prepare(`UPDATE skp_admin_owner_step_up_grants
 SET consumed_at=now()
 WHERE grant_hash=(
  SELECT grant_hash FROM skp_admin_owner_step_up_grants g
  WHERE owner_user_id=?::uuid AND session_token_hash=? AND action=?
   AND consumed_at IS NULL AND expires_at>now()
  AND EXISTS (SELECT 1 FROM skp_admin_passkeys p
   WHERE p.credential_id=g.verified_credential_id AND p.user_id=g.owner_user_id
    AND p.revoked_at IS NULL AND (?::text IS NULL OR md5(p.credential_id)<>?))
  ORDER BY created_at DESC,grant_hash DESC LIMIT 1 FOR UPDATE
 )
 AND consumed_at IS NULL AND expires_at>now()
 RETURNING grant_hash`)
 .bind(binding.ownerId,binding.sessionHash,action,excludedFingerprint,excludedFingerprint)
 .first<{grant_hash:string}>();
 return !!row;
}
