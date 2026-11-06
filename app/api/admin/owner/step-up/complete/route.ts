import type {AuthenticationResponseJSON} from '@simplewebauthn/server';
import {isTrustedAdminOrigin,isIsolatedOwnerBackupRequest} from '../../../../../../lib/admin-passkey-config';
import {allowNewAdminQrRequest} from '../../../../../../lib/admin-qr-rate-limit';
import {verifyOwnerStepUp} from '../../../../../../lib/admin-owner-step-up';
import {issueOwnerStepUpGrantAfterVerifiedAssertion} from '../../../../../../lib/admin-owner-step-up-grants';

export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff'};

/** Complete a fresh owner WebAuthn assertion before allowing backup enrollment.
 * The resulting grant is retained server-side, scoped to the existing session.
 */
export async function POST(request:Request){
 if(!isIsolatedOwnerBackupRequest(request))
  return Response.json({error:'Not enabled'},{status:404,headers});
 if(!isTrustedAdminOrigin(request))
  return Response.json({error:'Forbidden'},{status:403,headers});
 if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')
  return Response.json({error:'Unsupported content type'},{status:415,headers});
 const raw=await request.text();
 if(raw.length>16384)return Response.json({error:'Invalid request'},{status:400,headers});
 let input:unknown;
 try{input=JSON.parse(raw)}catch{return Response.json({error:'Invalid request'},{status:400,headers})}
 if(!input||typeof input!=='object'||Array.isArray(input))
  return Response.json({error:'Invalid request'},{status:400,headers});
 const {challenge,response,action}=input as Record<string,unknown>;
 if(action!=='owner-passkey-enroll'&&action!=='owner-passkey-revoke')return Response.json({error:'Invalid action'},{status:400,headers});
 if(typeof challenge!=='string'||!/^[a-f0-9]{64}$/.test(challenge)||
  !response||typeof response!=='object'||Array.isArray(response))
  return Response.json({error:'Invalid request'},{status:400,headers});
 try{
  if(!await allowNewAdminQrRequest())
   return Response.json({error:'Rate limited'},{status:429,headers});
  const verified=await verifyOwnerStepUp({
   request,challenge,response:response as AuthenticationResponseJSON,
   origin:request.headers.get('origin')||'',action,
  });
  if(!verified)return Response.json({error:'Verification failed'},{status:403,headers});
  const grant=await issueOwnerStepUpGrantAfterVerifiedAssertion(request,action);
  if(!grant)return Response.json({error:'Unavailable'},{status:503,headers});
  return Response.json({verified:true},{headers});
 }catch{return Response.json({error:'Unavailable'},{status:503,headers})}
}
