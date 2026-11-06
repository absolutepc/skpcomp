import {storeEnv,isPostgres} from '../db/platform-store';
import {qrChallengeHash} from './admin-qr-challenge';

/**
 * Single-use redemption primitive.
 * Never call until the phone's WebAuthn assertion has been verified and
 * the QR request has been explicitly approved.
 * A successful result is NOT itself an admin session.
 */
export async function consumeApprovedQr(requestToken:string,desktopSecret:string):Promise<boolean>{
 if(!isPostgres())throw new Error('PostgreSQL required');
 const requestHash=await qrChallengeHash(requestToken);
 const secretHash=await qrChallengeHash(desktopSecret);
 const {DB}=await storeEnv();
 const consumed=await DB.prepare(`UPDATE skp_admin_qr_requests
 SET status='consumed',consumed_at=now()
 WHERE request_hash=? AND desktop_secret_hash=?
 AND status='approved' AND expires_at>now()
 AND approved_user_id IS NOT NULL
 AND EXISTS (
   SELECT 1 FROM skp_admin_passkeys p
   JOIN skp_admin_users u ON u.id=p.user_id
   WHERE p.credential_id=skp_admin_qr_requests.approved_credential_id
    AND u.id=skp_admin_qr_requests.approved_user_id
    AND p.revoked_at IS NULL AND u.status='active'
 )
 RETURNING approved_user_id`)
  .bind(requestHash,secretHash).first<{approved_user_id:string}>();
 return !!consumed;
}
