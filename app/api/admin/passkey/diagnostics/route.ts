import {isTrustedAdminOrigin} from '../../../../../lib/admin-passkey-config';
import {verifyRecentAdminPassword} from '../../../../../lib/admin-passkey-reauth';
import {isPostgres,storeEnv} from '../../../../../db/platform-store';

export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff'};

/** Read-only staging diagnostic. Never returns credential IDs, keys, or user details.
 * Requires an authenticated admin session AND fresh password reauthentication.
 */
export async function POST(request:Request){
 if(process.env.SKP_ADMIN_OWNER_BACKUP_ENROLLMENT!=='staging'||
  process.env.SKP_ADMIN_STAGING_DB_ISOLATED!=='confirmed'||
  !isTrustedAdminOrigin(request)||!isPostgres())
  return Response.json({error:'Not available'},{status:404,headers});
 if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')
  return Response.json({error:'Invalid request'},{status:400,headers});
 const raw=await request.text();
 if(raw.length>2048)return Response.json({error:'Invalid request'},{status:400,headers});
 let body:unknown;
 try{body=JSON.parse(raw)}catch{return Response.json({error:'Invalid request'},{status:400,headers})}
 const password=body&&typeof body==='object'&&!Array.isArray(body)?(body as Record<string,unknown>).password:undefined;
 try{
  if(!await verifyRecentAdminPassword(request,password))
   return Response.json({error:'Not authorized'},{status:403,headers});
  const {DB}=await storeEnv();
  const result=await DB.prepare(`SELECT
   (SELECT count(*) FROM skp_admin_passkeys WHERE revoked_at IS NULL AND user_id IS NULL) AS unbound,
   (SELECT count(*) FROM skp_admin_passkeys p JOIN skp_admin_users u ON u.id=p.user_id
    WHERE p.revoked_at IS NULL AND u.status='active') AS bound,
   (SELECT count(*) FROM skp_admin_users WHERE role='owner' AND status='active') AS active_owners`).first<{
    unbound:string|number;bound:string|number;active_owners:string|number
   }>();
  return Response.json({unboundPasskeys:Number(result?.unbound||0),
   boundPasskeys:Number(result?.bound||0),
   activeOwners:Number(result?.active_owners||0)},{headers});
 }catch{return Response.json({error:'Diagnostic unavailable'},{status:503,headers})}
}
