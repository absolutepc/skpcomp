import {timingSafeEqual,createHash} from 'node:crypto';
import {storeEnv,isPostgres} from '../db/platform-store';
import {isAuthorizedAdmin} from './admin-authorization';
import {allowNewAdminQrRequest} from './admin-qr-rate-limit';

/**
 * Enrollment requires BOTH an existing authenticated admin session and
 * fresh knowledge of the admin password. Do not accept a session alone.
 * The global DB limiter is checked before any password comparison.
 */
export async function verifyRecentAdminPassword(request:Request,password:unknown):Promise<boolean>{
 if(!isPostgres()||typeof password!=='string'||password.length<1||password.length>1024)return false;
 if(!await allowNewAdminQrRequest())return false;
 if(!await isAuthorizedAdmin(request))return false;
 const {ADMIN_PASSWORD}=await storeEnv();
 if(!ADMIN_PASSWORD)return false;
 const actual=createHash('sha256').update(password,'utf8').digest();
 const expected=createHash('sha256').update(ADMIN_PASSWORD,'utf8').digest();
 return timingSafeEqual(actual,expected);
}
