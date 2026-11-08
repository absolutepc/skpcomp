import {isOwnerBackupRequest,isTrustedAdminOrigin} from '../../../../../../lib/admin-passkey-config';
import {createOwnerQrCheck} from '../../../../../../lib/admin-owner-qr-check';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 const headers={'Cache-Control':'no-store'};
 if(!isOwnerBackupRequest(request)||!isTrustedAdminOrigin(request))return Response.json({error:'Forbidden'},{status:403,headers});
 try{
  const body=await request.json();
  const result=await createOwnerQrCheck(request,body?.fingerprint);
  return Response.json(result,{headers});
 }catch{return Response.json({error:'Could not start verification'},{status:403,headers});}
}
