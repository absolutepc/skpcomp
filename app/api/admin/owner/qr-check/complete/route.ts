import type {AuthenticationResponseJSON} from '@simplewebauthn/server';
import {isOwnerBackupRequest,isTrustedAdminOrigin} from '../../../../../../../lib/admin-passkey-config';
import {completeOwnerQrCheck} from '../../../../../../../lib/admin-owner-qr-check';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 const headers={'Cache-Control':'no-store'};
 if(!isOwnerBackupRequest(request)||!isTrustedAdminOrigin(request))return Response.json({error:'Forbidden'},{status:403,headers});
 try{const body=await request.json();
  const verified=await completeOwnerQrCheck(body.requestToken,body.challenge,body.response as AuthenticationResponseJSON,request.headers.get('origin')||'');
  return Response.json({verified},{status:verified?200:403,headers});
 }catch{return Response.json({error:'Verification failed'},{status:403,headers});}
}
