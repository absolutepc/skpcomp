import {adminTransaction,storeEnv} from '../db/platform-store';

/** Acquire the employee row before child rows; re-check status after waiting.
 * Revocation uses the same lock. Separate statements get fresh READ COMMITTED
 * snapshots, so cleanup sees child records committed while waiting for the lock.
 */
export async function withActiveAdminUser<T>(userId:string,work:()=>Promise<T>,denied:T):Promise<T>{
 return adminTransaction(async()=>{
  const {DB}=await storeEnv();
  const user=await DB.prepare("SELECT id FROM skp_admin_users WHERE id=?::uuid AND status='active' FOR UPDATE")
   .bind(userId).first();
  return user?work():denied;
 });
}
