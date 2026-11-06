import {localAdminAccess} from './local-admin-access';
import {adminAuthorized} from './vercel-admin-session';
import {storeEnv,isPostgres} from '../db/platform-store';

/** Transitional admin authorization: accepts existing password login cookies
 * and new random database-backed sessions. Production sessions are fail-closed
 * when the database is unavailable.
 */
export async function isAuthorizedAdmin(request:Request):Promise<boolean>{
 if(localAdminAccess(request))return true;
 const {ADMIN_PASSWORD}=await storeEnv();
 if(!ADMIN_PASSWORD)return false;
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('skp-session:'+ADMIN_PASSWORD));
 const legacy=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
 if((request.headers.get('cookie')||'').split(';').some(x=>x.trim()==='skp_admin='+legacy))
  return true;
 if(!isPostgres())return false;
 return adminAuthorized(request);
}
