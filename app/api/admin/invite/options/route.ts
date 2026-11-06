import {isTrustedAdminOrigin,adminWebAuthnConfig} from '../../../../../lib/admin-passkey-config';
import {findValidEmployeeInvitation} from '../../../../../lib/admin-employee-invitations';
import {issueWebAuthnChallenge} from '../../../../../lib/admin-webauthn-challenges';
import {allowNewAdminQrRequest} from '../../../../../lib/admin-qr-rate-limit';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
export async function POST(request:Request){
 if(!isTrustedAdminOrigin(request))return Response.json({error:'Forbidden'},{status:403,headers});
 if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')
  return Response.json({error:'Unsupported content type'},{status:415,headers});
 const raw=await request.text();
 if(raw.length>512)return Response.json({error:'Invalid request'},{status:400,headers});
 let body:unknown;
 try{body=JSON.parse(raw)}catch{return Response.json({error:'Invalid request'},{status:400,headers})}
 const token=body&&typeof body==='object'&&!Array.isArray(body)?(body as Record<string,unknown>).inviteToken:null;
 if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))
  return Response.json({error:'Invalid request'},{status:400,headers});
 try{
  if(!await allowNewAdminQrRequest())return Response.json({error:'Rate limited'},{status:429,headers});
  if(!await findValidEmployeeInvitation(token))return Response.json({error:'Invitation invalid'},{status:403,headers});
  const challenge=await issueWebAuthnChallenge('register','invite:'+token);
  const {rpID}=adminWebAuthnConfig(request.headers.get('origin')||'');
  return Response.json({...challenge,rpID,userVerification:'required'},{headers});
 }catch{return Response.json({error:'Unavailable'},{status:503,headers})}
}
