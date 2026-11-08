import {withActiveAdminUser} from './admin-user-lock';
import {isPostgres,storeEnv} from '../db/platform-store';
import {qrChallengeHash} from './admin-qr-challenge';

/**
 * A verified WebAuthn assertion and explicit user approval are required
 * BEFORE invoking this helper. This function never verifies an assertion,
 * sets a cookie, or grants an admin session.
 */
export async function markQrApprovedAfterVerification(
 requestToken:string,credentialId:string
):Promise<boolean>{
 if(!isPostgres())throw new Error('PostgreSQL required');
 if(!credentialId||credentialId.length>2048)return false;
 const requestHash=await qrChallengeHash(requestToken);
 const {DB}=await storeEnv();
 const credential=await DB.prepare('SELECT user_id FROM skp_admin_passkeys WHERE credential_id=?')
  .bind(credentialId).first<{user_id:string|null}>();
 if(!credential?.user_id)return false;
 return withActiveAdminUser(credential.user_id,async()=>{
 const updated=await DB.prepare(`UPDATE skp_admin_qr_requests
 SET status='approved',approved_credential_id=?,
 approved_user_id=(SELECT user_id FROM skp_admin_passkeys WHERE credential_id=?),
 approved_at=now()
 WHERE request_hash=? AND status='pending' AND expires_at>now()
 AND EXISTS (
  SELECT 1 FROM skp_admin_passkeys p
  JOIN skp_admin_users u ON u.id=p.user_id
  WHERE p.credential_id=? AND p.revoked_at IS NULL AND u.status='active'
 )
 RETURNING request_hash`)
  .bind(credentialId,credentialId,requestHash,credentialId).first<{request_hash:string}>();
 return !!updated;
 },false);
}

/** Reject a still-pending QR request; a rejected request cannot be approved. */
export async function denyPendingQr(requestToken:string):Promise<boolean>{
 if(!isPostgres())throw new Error('PostgreSQL required');
 const requestHash=await qrChallengeHash(requestToken);
 const {DB}=await storeEnv();
 const updated=await DB.prepare(`UPDATE skp_admin_qr_requests
 SET status='denied'
 WHERE request_hash=? AND status='pending' AND expires_at>now()
 RETURNING request_hash`)
  .bind(requestHash).first<{request_hash:string}>();
 return !!updated;
}
