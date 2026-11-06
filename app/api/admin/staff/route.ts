import {activeSessionOwnerId} from '../../../../lib/vercel-admin-session';
import {revokeEmployeeAccess} from '../../../../lib/admin-employee-revocation';
import {issueEmployeeInvitation} from '../../../../lib/admin-employee-invitations';
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
  const events=await DB.prepare(`SELECT e.id,e.event_type,e.created_at,e.actor_user_id,e.target_user_id,
   actor.display_name AS actor_name,target.display_name AS target_name
   FROM skp_admin_security_events e
   LEFT JOIN skp_admin_users actor ON actor.id=e.actor_user_id
   LEFT JOIN skp_admin_users target ON target.id=e.target_user_id
   ORDER BY e.created_at DESC,e.id DESC LIMIT 100`).all();
  return Response.json({users:users.results,events:events.results},{headers});
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
 if(!body||typeof body!=='object'||Array.isArray(body))return Response.json({error:'Invalid request'},{status:400,headers});
 const {action,userId,displayName}=body as Record<string,unknown>;
 if((action==='block'||action==='invite') && (typeof userId!=='string'||!idPattern.test(userId)))
  return Response.json({error:'Invalid request'},{status:400,headers});
 if(action==='create' && (typeof displayName!=='string'||displayName.trim().length<1||displayName.trim().length>120))
  return Response.json({error:'Invalid request'},{status:400,headers});
 if(action!=='block'&&action!=='create'&&action!=='invite')
  return Response.json({error:'Invalid request'},{status:400,headers});
 try{
  const ownerId=await activeSessionOwnerId(request);
  if(!ownerId)return Response.json({error:'Forbidden'},{status:403,headers});
  if(action==='create'){
   const {DB}=await storeEnv();
   const created=await DB.prepare(`WITH new_user AS (
    INSERT INTO skp_admin_users(display_name,role,status)
    VALUES (?,'admin','active') RETURNING id,display_name,role,status
   ), audit AS (
    INSERT INTO skp_admin_security_events(actor_user_id,target_user_id,event_type)
    SELECT ?::uuid,id,'user_created' FROM new_user RETURNING id
   ) SELECT id,display_name,role,status FROM new_user`)
    .bind((displayName as string).trim(),ownerId).first();
   return Response.json({user:created},{status:201,headers});
  }
  if(action==='invite'){
   const token=await issueEmployeeInvitation(ownerId,userId as string);
   return token?Response.json({inviteToken:token,expiresInSeconds:900},{headers}):
    Response.json({error:'Employee unavailable'},{status:409,headers});
  }
  if(ownerId===userId)return Response.json({error:'Cannot block owner'},{status:403,headers});
  const blocked=await revokeEmployeeAccess(userId as string,ownerId);
  return Response.json({blocked},{status:blocked?200:409,headers});
 }catch{return Response.json({error:'Unavailable'},{status:503,headers})}
}
