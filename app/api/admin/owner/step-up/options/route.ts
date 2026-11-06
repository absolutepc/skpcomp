import {storeEnv} from '../../../../../../db/platform-store';
import {activeOwnerSessionBinding} from '../../../../../../lib/vercel-admin-session';
import {ownerStepUpContext} from '../../../../../../lib/admin-owner-step-up';
import type {OwnerStepUpAction} from '../../../../../../lib/admin-owner-step-up-grants';
import {isTrustedAdminOrigin,isOwnerBackupRequest,adminWebAuthnConfig} from '../../../../../../lib/admin-passkey-config';
import {issueWebAuthnChallenge} from '../../../../../../lib/admin-webauthn-challenges';
import {allowNewAdminQrRequest} from '../../../../../../lib/admin-qr-rate-limit';

export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff'};
/** Owner step-up challenge only. Never grants enrollment or a session. */
export async function POST(request:Request){
 if(!isOwnerBackupRequest(request))
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
  const {action,fingerprint} = body as Record<string,unknown>;
  if(action!=='owner-passkey-enroll'&&action!=='owner-passkey-revoke'&&action!=='owner-passkey-test')return Response.json({error:'Invalid action'},{status:400,headers});
  if(fingerprint!==undefined&&(typeof fingerprint!=='string'||!/^[a-f0-9]{32}$/.test(fingerprint)))return Response.json({error:'Invalid fingerprint'},{status:400,headers});
  if(action==='owner-passkey-test'&&typeof fingerprint!=='string')return Response.json({error:'Select a key'},{status:400,headers});
  const {DB}=await storeEnv();
  const keys=await DB.prepare("SELECT credential_id FROM skp_admin_passkeys WHERE user_id=?::uuid AND revoked_at IS NULL AND (?::text IS NULL OR CASE WHEN ?='owner-passkey-revoke' THEN md5(credential_id)<>? ELSE md5(credential_id)=? END)").bind(binding.ownerId,fingerprint??null,action,fingerprint??null,fingerprint??null).all<{credential_id:string}>();
  if(!keys.results.length)return Response.json({error:'No eligible owner key'},{status:403,headers});
  const {rpID}=adminWebAuthnConfig(request.headers.get('origin')||'');
  const {challenge,expiresAt}=await issueWebAuthnChallenge('authenticate',ownerStepUpContext(binding.ownerId,binding.sessionHash,action as OwnerStepUpAction,fingerprint as string|undefined));
  return Response.json({challenge,expiresAt,rpID,userVerification:'required',allowCredentials:keys.results.map(key=>({type:'public-key',id:key.credential_id}))},{headers});
 }catch{return Response.json({error:'Unavailable'},{status:503,headers})}
}
