import {activeSessionOwnerId} from '../../../../lib/vercel-admin-session';
import {revokeEmployeeAccess} from '../../../../lib/admin-employee-revocation';
import {isPostgres,storeEnv} from '../../../../db/platform-store';
import {isTrustedAdminOrigin} from '../../../../lib/admin-passkey-config';

export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const idPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request:Request){
 if(!isPostgres())return Response.json({error:'Unavailable'},{status:503,headers});
 try{
  const ownerId=await activeSessionOwnerId(request);
  if(!ownerId)return Response.json({error:'Forbidden'},{status:403,headers});
  const {DB}=await storeEnv();
  const users=await DB.prepare(`SELECT id,display_name,role,status,created_at,blocked_at
   FROM skp_admin_users ORDER BY created_at DESC`).all();
  return Response.json({users:users.results},{headers});
 }catch{return Response.json({error:'Unavailable'},{status:503,headers})}
}

export async function POST(request:Request){
 if(!isPostgres())return Response.json({error:'Unavailable'},{status:503,headers});
 if(!isTrustedAdminOrigin(request))
  return Response.json({error:'Forbidden'},{status:403,headers});
 if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')
  return Response.json({error:'Unsupported content type'},{status:415,headers});
 const raw=await request.text();
 if(raw.length>1024)return Response.json({error:'Invalid request'},{status:400,headers});
 let body:unknown;
 try{body=JSON.parse(raw)}catch{return Response.json({error:'Invalid request'},{status:400,headers})}
 if(!body||typeof body!=='object')return Response.json({error:'Invalid request'},{status:400,headers});
 const {action,userId}=body as Record<string,unknown>;
 if(action!=='block'||typeof userId!=='string'||!idPattern.test(userId))
  return Response.json({error:'Invalid request'},{status:400,headers});
 try{
  const ownerId=await activeSessionOwnerId(request);
  if(!ownerId)return Response.json({error:'Forbidden'},{status:403,headers});
  if(ownerId===userId)return Response.json({error:'Cannot block owner'},{status:403,headers});
  const blocked=await revokeEmployeeAccess(userId);
  return Response.json({blocked},{status:blocked?200:409,headers});
 }catch{return Response.json({error:'Unavailable'},{status:503,headers})}
}
