import {isTrustedAdminOrigin} from '../../../../../../../lib/admin-passkey-config';
import {revokeOwnerPasskey} from '../../../../../../../lib/admin-owner-passkey-revocation';

export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff'};
/** Owner-only staging endpoint. Requires a fresh session-bound WebAuthn step-up grant. */
export async function POST(request:Request){
 if(process.env.SKP_ADMIN_OWNER_BACKUP_ENROLLMENT!=='staging')return Response.json({error:'Not enabled'},{status:404,headers});
 if(!isTrustedAdminOrigin(request))return Response.json({error:'Forbidden'},{status:403,headers});
 if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')return Response.json({error:'Unsupported content type'},{status:415,headers});
 const raw=await request.text();
 if(raw.length>1024)return Response.json({error:'Invalid request'},{status:400,headers});
 let data:unknown;
 try{data=JSON.parse(raw)}catch{return Response.json({error:'Invalid request'},{status:400,headers})}
 if(!data||typeof data!=='object'||Array.isArray(data))return Response.json({error:'Invalid request'},{status:400,headers});
 const {fingerprint}=data as Record<string,unknown>;
 if(typeof fingerprint!=='string'||!/^[a-f0-9]{32}$/.test(fingerprint))return Response.json({error:'Invalid request'},{status:400,headers});
 try{
  const revoked=await revokeOwnerPasskey(request,fingerprint);
  return Response.json({revoked},{status:revoked?200:403,headers});
 }catch{return Response.json({error:'Unavailable'},{status:503,headers})}
}
