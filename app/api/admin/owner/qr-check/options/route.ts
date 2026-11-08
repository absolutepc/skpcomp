import {isOwnerBackupRequest,isTrustedAdminOrigin} from '../../../../../../lib/admin-passkey-config';
import {ownerQrOptions} from '../../../../../../lib/admin-owner-qr-check';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 const headers={'Cache-Control':'no-store'};
 if(!isOwnerBackupRequest(request)||!isTrustedAdminOrigin(request))return Response.json({error:'Forbidden'},{status:403,headers});
 try{const body=await request.json();return Response.json(await ownerQrOptions(body.requestToken,request.headers.get('origin')||''),{headers});}
 catch{return Response.json({error:'QR request expired or unavailable'},{status:403,headers});}
}
