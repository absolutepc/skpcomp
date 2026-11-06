import {isTrustedAdminOrigin,adminWebAuthnConfig} from '../../../../../lib/admin-passkey-config';
import {allowNewAdminQrRequest} from '../../../../../lib/admin-qr-rate-limit';
import {isPendingQrRequest} from '../../../../../lib/admin-qr-eligibility';
import {issueWebAuthnChallenge} from '../../../../../lib/admin-webauthn-challenges';

export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
export async function POST(request:Request){
 if(!isTrustedAdminOrigin(request))return Response.json({error:'Forbidden'},{status:403,headers});
 if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')
  return Response.json({error:'Unsupported content type'},{status:415,headers});
 const raw=await request.text();
 if(raw.length>1024)return Response.json({error:'Invalid request'},{status:400,headers});
 let input:unknown;
 try{input=JSON.parse(raw)}catch{return Response.json({error:'Invalid request'},{status:400,headers})}
 const token=(input&&typeof input==='object'&&(input as Record<string,unknown>).requestToken);
 if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))
  return Response.json({error:'Invalid request'},{status:400,headers});
 try{
  if(!await isPendingQrRequest(token))
   return Response.json({error:'QR request unavailable'},{status:404,headers});
  if(!await allowNewAdminQrRequest())
   return Response.json({error:'Too many requests'},{status:429,headers:{...headers,'Retry-After':'60'}});
  const {challenge,expiresAt}=await issueWebAuthnChallenge('authenticate',token);
  const {rpID}=adminWebAuthnConfig(request.headers.get('origin')||'');
  return Response.json({challenge,rpID,userVerification:'required',expiresAt},{headers});
 }catch{return Response.json({error:'Unavailable'},{status:503,headers})}
}
