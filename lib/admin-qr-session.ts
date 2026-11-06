import {storeEnv} from '../db/platform-store';
import {withActiveAdminUser} from './admin-user-lock';
import {qrChallengeHash} from './admin-qr-challenge';
import {consumeApprovedQr} from './admin-qr-consume';
import {issueAdminSession} from './vercel-admin-session';

/** One transaction: consume the desktop-bound request and issue the cookie.
 * A failed insert rolls back redemption. User lock serializes with blocking.
 */
export async function redeemQrSession(request:Request,requestToken:string,desktopSecret:string):Promise<string|null>{
 const {DB}=await storeEnv();
 const qr=await DB.prepare(`SELECT approved_user_id FROM skp_admin_qr_requests
  WHERE request_hash=? AND desktop_secret_hash=? AND status='approved' AND expires_at>now()`)
  .bind(await qrChallengeHash(requestToken),await qrChallengeHash(desktopSecret))
  .first<{approved_user_id:string|null}>();
 if(!qr?.approved_user_id)return null;
 return withActiveAdminUser(qr.approved_user_id,async()=>{
  const employeeId=await consumeApprovedQr(requestToken,desktopSecret);
  if(!employeeId)return null;
  return issueAdminSession(request,employeeId);
 },null);
}
