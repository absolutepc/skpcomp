import {isTrustedAdminOrigin} from '../../../../../../lib/admin-passkey-config';
import {activeSessionOwnerId} from '../../../../../../lib/vercel-admin-session';
import {allowNewAdminQrRequest} from '../../../../../../lib/admin-qr-rate-limit';
import {enrollmentContextFromRequest} from '../../../../../../lib/admin-passkey-enrollment-context';
import {verifyAndStoreAdminPasskeyRegistration} from '../../../../../../lib/admin-passkey-register';
import type {RegistrationResponseJSON} from '@simplewebauthn/server';

export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
export async function POST(request:Request){
 if(!isTrustedAdminOrigin(request))return Response.json({error:'Forbidden'},{status:403,headers});
 if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')
  return Response.json({error:'Unsupported content type'},{status:415,headers});
 const raw=await request.text();
 if(raw.length>32768)return Response.json({error:'Invalid request'},{status:400,headers});
 let body:unknown;
 try{body=JSON.parse(raw)}catch{return Response.json({error:'Invalid request'},{status:400,headers})}
 if(!body||typeof body!=='object'||Array.isArray(body))
  return Response.json({error:'Invalid request'},{status:400,headers});
 const {challenge,response,deviceLabel}=body as Record<string,unknown>;
 if(typeof challenge!=='string'||!/^[a-f0-9]{64}$/.test(challenge)||
  !response||typeof response!=='object'||Array.isArray(response)||
  (deviceLabel!==undefined&&(typeof deviceLabel!=='string'||deviceLabel.length>100)))
  return Response.json({error:'Invalid registration'},{status:400,headers});
 try{
  if(!await allowNewAdminQrRequest())
   return Response.json({error:'Too many requests'},{status:429,headers:{...headers,'Retry-After':'60'}});
  const ownerId=await activeSessionOwnerId(request);
  if(!ownerId)return Response.json({error:'Owner session required; use owner enrollment'},{status:403,headers});
  const contextId=await enrollmentContextFromRequest(request);
  if(!contextId)return Response.json({error:'Forbidden'},{status:403,headers});
  const registered=await verifyAndStoreAdminPasskeyRegistration({
   response:response as RegistrationResponseJSON,challenge,contextId,
   origin:request.headers.get('origin')||'',deviceLabel:deviceLabel as string|undefined,ownerId,
  });
  return Response.json({registered},{status:registered?200:403,headers});
 }catch{return Response.json({error:'Registration failed'},{status:403,headers})}
}
