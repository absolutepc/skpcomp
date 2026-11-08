import {isTrustedAdminOrigin,adminWebAuthnConfig} from '../../../../../../lib/admin-passkey-config';
import {beginAdminPasskeyEnrollment} from '../../../../../../lib/admin-passkey-enrollment-context';

export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
export async function POST(request:Request){
 if(!isTrustedAdminOrigin(request))return Response.json({error:'Forbidden'},{status:403,headers});
 if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')
  return Response.json({error:'Unsupported content type'},{status:415,headers});
 const raw=await request.text();
 if(raw.length>2048)return Response.json({error:'Invalid request'},{status:400,headers});
 let body:unknown;
 try{body=JSON.parse(raw)}catch{return Response.json({error:'Invalid request'},{status:400,headers})}
 if(!body||typeof body!=='object'||Array.isArray(body))
  return Response.json({error:'Invalid request'},{status:400,headers});
 const {password}=body as Record<string,unknown>;
 try{
  const issued=await beginAdminPasskeyEnrollment(request,password);
  if(!issued)return Response.json({error:'Unauthorized or rate limited'},{status:403,headers});
  const {rpID}=adminWebAuthnConfig(request.headers.get('origin')||'');
  return Response.json({...issued,rpID,userVerification:'required'},{headers});
 }catch{return Response.json({error:'Unavailable'},{status:503,headers})}
}
