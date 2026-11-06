import {isAuthorizedAdmin} from './admin-authorization';
import {sessionAdminUserId,adminAuthorized} from './vercel-admin-session';
import {withActiveAdminUser} from './admin-user-lock';
import {isPostgres} from '../db/platform-store';

/** Once cut over, employee blocking and privileged database operations are
 * serialized. A block response cannot complete ahead of an already authorized
 * transaction that still writes. Parse request bodies before entering this scope.
 * Legacy production behavior is preserved until the explicit cutover.
 */
export async function withAdminOperation(request:Request,work:()=>Promise<Response>):Promise<Response>{
 const denied=()=>Response.json({error:'Требуется авторизация администратора.'},{status:401,headers:{'Cache-Control':'no-store'}});
 try{
  if(process.env.SKP_ADMIN_REQUIRE_PASSKEY!=='true')return await isAuthorizedAdmin(request)?await work():denied();
  if(!isPostgres())return denied();
  const userId=await sessionAdminUserId(request);
  if(!userId)return denied();
  return await withActiveAdminUser(userId,async()=>await adminAuthorized(request)?work():denied(),denied());
 }catch{return Response.json({error:'Сервис временно недоступен.'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
