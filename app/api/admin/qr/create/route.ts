import {createPendingQr} from '../../../../../lib/admin-qr-pending';
import {adminQrApprovalUrl} from '../../../../../lib/admin-qr-url';
import {isTrustedAdminOrigin} from '../../../../../lib/admin-passkey-config';

export const dynamic='force-dynamic';
const headers={
 'Cache-Control':'no-store, max-age=0',
 'Pragma':'no-cache',
 'X-Content-Type-Options':'nosniff',
};
export async function POST(request:Request){
 if(!isTrustedAdminOrigin(request))
  return Response.json({error:'Forbidden'},{status:403,headers});
 if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')
  return Response.json({error:'Unsupported content type'},{status:415,headers});
 try{
  const {requestToken,desktopSecret,expiresAt}=await createPendingQr();
  return Response.json({
   requestToken,desktopSecret,expiresAt,
   approvalUrl:adminQrApprovalUrl(requestToken),
  },{status:201,headers});
 }catch{
  return Response.json({error:'Unavailable'},{status:503,headers});
 }
}
