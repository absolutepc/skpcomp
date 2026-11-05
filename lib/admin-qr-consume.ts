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
 AND approved_credential_id IN (
   SELECT credential_id FROM skp_admin_passkeys WHERE revoked_at IS NULL
 )
 RETURNING request_hash`)
  .bind(requestHash,secretHash).first<{request_hash:string}>();
 return !!consumed;
}
