import {activeSessionOwnerId} from '../../../../../../lib/vercel-admin-session';
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
  const ownerId=await activeSessionOwnerId(request);
  if(!ownerId)return Response.json({error:'Forbidden'},{status:403,headers});
  if(!await allowNewAdminQrRequest())
   return Response.json({error:'Rate limited'},{status:429,headers});
  const {rpID}=adminWebAuthnConfig(request.headers.get('origin')||'');
  const {challenge,expiresAt}=await issueWebAuthnChallenge('authenticate','owner-step-up:'+ownerId);
  return Response.json({challenge,expiresAt,rpID,userVerification:'required'},{headers});
 }catch{return Response.json({error:'Unavailable'},{status:503,headers})}
}
