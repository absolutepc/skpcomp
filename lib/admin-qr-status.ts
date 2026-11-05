import {storeEnv,isPostgres} from '../db/platform-store';
import {qrChallengeHash} from './admin-qr-challenge';

export type QrPendingStatus='pending'|'approved'|'consumed'|'denied'|'expired';

/** Requires BOTH the scanned request ID and desktop-only secret. */
export async function readQrStatus(requestToken:string,desktopSecret:string):Promise<QrPendingStatus>{
 if(!isPostgres())throw new Error('PostgreSQL required');
 const requestHash=await qrChallengeHash(requestToken);
 const secretHash=await qrChallengeHash(desktopSecret);
 const {DB}=await storeEnv();
 const row=await DB.prepare("SELECT status FROM skp_admin_qr_requests WHERE request_hash=? AND desktop_secret_hash=? AND expires_at>now()")
  .bind(requestHash,secretHash).first<{status:QrPendingStatus}>();
 switch(row?.status){
  case 'pending':case 'approved':case 'consumed':case 'denied':return row.status;
  default:return 'expired';
 }
}
