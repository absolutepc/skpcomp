import {hasRecentOwnerStepUpGrant} from '../../../../../../lib/admin-owner-step-up-grants';
import {activeOwnerSessionBinding} from '../../../../../../lib/vercel-admin-session';
import {ownerBackupChallengeContext} from '../../../../../../lib/admin-owner-backup-registration';
import {isTrustedAdminOrigin,adminWebAuthnConfig} from '../../../../../../lib/admin-passkey-config';
import {allowNewAdminQrRequest} from '../../../../../../lib/admin-qr-rate-limit';
import {issueWebAuthnChallenge} from '../../../../../../lib/admin-webauthn-challenges';

export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff'};

/** Owner-initiated backup credential registration: challenge only.
 * This endpoint does NOT register a credential or grant a login.
 * The completion endpoint must re-check the owner session, verify the
 * WebAuthn attestation and consume this challenge atomically.
 */
export async function POST(request:Request){
 if(process.env.SKP_ADMIN_OWNER_BACKUP_ENROLLMENT!=='staging')return Response.json({error:'Not enabled'},{status:404,headers});
 if(!isTrustedAdminOrigin(request))return Response.json({error:'Forbidden'},{status:403,headers});
 const binding=await activeOwnerSessionBinding(request);
 if(!binding)return Response.json({error:'Forbidden'},{status:403,headers});
 if(!await hasRecentOwnerStepUpGrant(request,'owner-passkey-enroll'))return Response.json({error:'Fresh owner verification required'},{status:403,headers});
 if(!await allowNewAdminQrRequest())return Response.json({error:'Rate limited'},{status:429,headers});
 try{
  const {rpID}=adminWebAuthnConfig(request.headers.get('origin')||'');
  const {challenge,expiresAt}=await issueWebAuthnChallenge('register',ownerBackupChallengeContext(binding.ownerId,binding.sessionHash));
  return Response.json({challenge,expiresAt,rpID,userVerification:'required'},{headers});
 }catch{return Response.json({error:'Unavailable'},{status:503,headers})}
}
