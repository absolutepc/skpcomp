import type {RegistrationResponseJSON} from '@simplewebauthn/server';
import {isTrustedAdminOrigin,isIsolatedOwnerBackupRequest} from '../../../../../../lib/admin-passkey-config';
import {allowNewAdminQrRequest} from '../../../../../../lib/admin-qr-rate-limit';
import {completeOwnerBackupPasskey} from '../../../../../../lib/admin-owner-backup-registration';

export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff'};
/** Staging-only until independent step-up reauthentication is implemented. */
export async function POST(request:Request){
 if(!isIsolatedOwnerBackupRequest(request))
  return Response.json({error:'Not enabled'},{status:404,headers});
 if(!isTrustedAdminOrigin(request))
  return Response.json({error:'Forbidden'},{status:403,headers});
 if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')
  return Response.json({error:'Unsupported content type'},{status:415,headers});
 const raw=await request.text();
 if(raw.length>32768)return Response.json({error:'Invalid request'},{status:400,headers});
 let input:unknown;
 try{input=JSON.parse(raw)}catch{return Response.json({error:'Invalid request'},{status:400,headers})}
 if(!input||typeof input!=='object'||Array.isArray(input))
  return Response.json({error:'Invalid request'},{status:400,headers});
 const {challenge,response,deviceLabel}=input as Record<string,unknown>;
 if(typeof challenge!=='string'||!/^[a-f0-9]{64}$/.test(challenge)||
  !response||typeof response!=='object'||Array.isArray(response)||
  (deviceLabel!==undefined&&(typeof deviceLabel!=='string'||deviceLabel.length>100)))
  return Response.json({error:'Invalid request'},{status:400,headers});
 try{
  if(!await allowNewAdminQrRequest())return Response.json({error:'Rate limited'},{status:429,headers});
  const registered=await completeOwnerBackupPasskey({
   request,challenge,response:response as RegistrationResponseJSON,
   origin:request.headers.get('origin')||'',deviceLabel:deviceLabel as string|undefined,
  });
  return Response.json({registered},{status:registered?200:403,headers});
 }catch{return Response.json({error:'Registration failed'},{status:403,headers})}
}
