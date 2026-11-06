import {isTrustedAdminOrigin} from '../../../../../lib/admin-passkey-config';
import {isPendingQrRequest} from '../../../../../lib/admin-qr-eligibility';
import {verifyAdminPasskeyAssertion} from '../../../../../lib/admin-passkey-verify';
import {markQrApprovedAfterVerification} from '../../../../../lib/admin-qr-decision';
import type {AuthenticationResponseJSON} from '@simplewebauthn/server';

export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
export async function POST(request:Request){
 if(!isTrustedAdminOrigin(request))
  return Response.json({error:'Forbidden'},{status:403,headers});
 if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')
  return Response.json({error:'Unsupported content type'},{status:415,headers});
 const raw=await request.text();
 if(raw.length>16384)return Response.json({error:'Invalid request'},{status:400,headers});
 let input:unknown;
 try{input=JSON.parse(raw)}catch{return Response.json({error:'Invalid request'},{status:400,headers})}
 if(!input||typeof input!=='object')return Response.json({error:'Invalid request'},{status:400,headers});
 const {requestToken,challenge,response,approved}=input as Record<string,unknown>;
 if(typeof requestToken!=='string'||!/^[a-f0-9]{64}$/.test(requestToken)||
  typeof approved!=='boolean')
  return Response.json({error:'Invalid request'},{status:400,headers});
 try{
  if(!await isPendingQrRequest(requestToken))
   return Response.json({error:'QR request unavailable'},{status:404,headers});
  if(typeof challenge!=='string'||!/^[a-f0-9]{64}$/.test(challenge)||
   !response||typeof response!=='object'||Array.isArray(response))
   return Response.json({error:'Invalid assertion'},{status:400,headers});
  const verified=await verifyAdminPasskeyAssertion({
   response:response as AuthenticationResponseJSON,
   challenge,
   contextId:requestToken,
   origin:request.headers.get('origin')||'',
  });
  if(!verified)return Response.json({error:'Passkey verification failed'},{status:403,headers});
  if(!approved)return Response.json({status:'not-approved'},{headers});
  const ok=await markQrApprovedAfterVerification(requestToken,verified.credentialId);
  return Response.json({status:ok?'approved':'unavailable'},{status:ok?200:409,headers});
 }catch{return Response.json({error:'Unavailable'},{status:503,headers})}
}
