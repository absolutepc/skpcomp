import {activeOwnerSessionBinding} from '../../../../../../lib/vercel-admin-session';
import {ownerStepUpContext} from '../../../../../../lib/admin-owner-step-up';
import type {OwnerStepUpAction} from '../../../../../../lib/admin-owner-step-up-grants';
import {isTrustedAdminOrigin,adminWebAuthnConfig} from '../../../../../../lib/admin-passkey-config';
import {issueWebAuthnChallenge} from '../../../../../../lib/admin-webauthn-challenges';
import {allowNewAdminQrRequest} from '../../../../../../lib/admin-qr-rate-limit';

export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff'};
/** Owner step-up challenge only. Never grants enrollment or a session. */
export async function POST(request:Request){
 if(process.env.SKP_ADMIN_OWNER_BACKUP_ENROLLMENT!=='staging')
  return Response.json({error:'Not enabled'},{status:404,headers});
 if(!isTrustedAdminOrigin(request))
  return Response.json({error:'Forbidden'},{status:403,headers});
 try{
  const binding=await activeOwnerSessionBinding(request);
  if(!binding)return Response.json({error:'Forbidden'},{status:403,headers});
  if(!await allowNewAdminQrRequest())
   return Response.json({error:'Rate limited'},{status:429,headers});
  if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')
   return Response.json({error:'Unsupported content type'},{status:415,headers});
  const raw=await request.text();
  if(raw.length>1024)return Response.json({error:'Invalid request'},{status:400,headers});
  let body:unknown;
  try{body=JSON.parse(raw)}catch{return Response.json({error:'Invalid request'},{status:400,headers})}
  if(!body||typeof body!=='object'||Array.isArray(body))return Response.json({error:'Invalid request'},{status:400,headers});
  const {action} = body as Record<string,unknown>;
  if(action!=='owner-passkey-enroll'&&action!=='owner-passkey-revoke')return Response.json({error:'Invalid action'},{status:400,headers});
  const {rpID}=adminWebAuthnConfig(request.headers.get('origin')||'');
  const {challenge,expiresAt}=await issueWebAuthnChallenge('authenticate',ownerStepUpContext(binding.ownerId,binding.sessionHash,action as OwnerStepUpAction));
  return Response.json({challenge,expiresAt,rpID,userVerification:'required'},{headers});
 }catch{return Response.json({error:'Unavailable'},{status:503,headers})}
}
