import {isTrustedAdminOrigin} from '../../../../../lib/admin-passkey-config';
import {completeEmployeePasskeyInvitation} from '../../../../../lib/admin-employee-passkey-registration';
import {allowNewAdminQrRequest} from '../../../../../lib/admin-qr-rate-limit';
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
 const {inviteToken,challenge,response,deviceLabel}=body as Record<string,unknown>;
 if(typeof inviteToken!=='string'||!/^[a-f0-9]{64}$/.test(inviteToken)||
  typeof challenge!=='string'||!/^[a-f0-9]{64}$/.test(challenge)||
  !response||typeof response!=='object'||Array.isArray(response)||
  (deviceLabel!==undefined&&(typeof deviceLabel!=='string'||deviceLabel.length>100)))
  return Response.json({error:'Invalid request'},{status:400,headers});
 try{
  if(!await allowNewAdminQrRequest())return Response.json({error:'Rate limited'},{status:429,headers});
  const registered=await completeEmployeePasskeyInvitation({
   inviteToken,challenge,response:response as RegistrationResponseJSON,
   origin:request.headers.get('origin')||'',deviceLabel:deviceLabel as string|undefined,
  });
  return Response.json({registered},{status:registered?200:403,headers});
 }catch{return Response.json({error:'Registration failed'},{status:403,headers})}
}
