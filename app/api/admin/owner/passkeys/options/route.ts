import {activeSessionOwnerId} from '../../../../../../lib/vercel-admin-session';
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
 if(!isTrustedAdminOrigin(request))return Response.json({error:'Forbidden'},{status:403,headers});
 if(!await activeSessionOwnerId(request))return Response.json({error:'Forbidden'},{status:403,headers});
 if(!await allowNewAdminQrRequest())return Response.json({error:'Rate limited'},{status:429,headers});
 try{
  const ownerId=await activeSessionOwnerId(request);
  if(!ownerId)return Response.json({error:'Forbidden'},{status:403,headers});
  const {rpID}=adminWebAuthnConfig(request.headers.get('origin')||'');
  const {challenge,expiresAt}=await issueWebAuthnChallenge('register','owner-backup:'+ownerId);
  return Response.json({challenge,expiresAt,rpID,userVerification:'required'},{headers});
 }catch{return Response.json({error:'Unavailable'},{status:503,headers})}
}
