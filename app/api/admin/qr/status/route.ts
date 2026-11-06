import {readQrStatus} from '../../../../../lib/admin-qr-status';
import {isTrustedAdminOrigin} from '../../../../../lib/admin-passkey-config';

export const dynamic='force-dynamic';

const headers={
 'Cache-Control':'no-store, max-age=0',
 'Pragma':'no-cache',
 'Content-Type':'application/json',
 'X-Content-Type-Options':'nosniff',
};

export async function POST(request:Request){
 if(!isTrustedAdminOrigin(request))
  return Response.json({error:'Forbidden'},{status:403,headers});
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
  return Response.json({error:'Invalid content type'},{status:415,headers});
 const raw=await request.text();
 if(raw.length>1024)return Response.json({error:'Invalid request'},{status:400,headers});
 let body:unknown;
 try{body=JSON.parse(raw)}catch{return Response.json({error:'Invalid request'},{status:400,headers})}
 if(!body||typeof body!=='object')return Response.json({error:'Invalid request'},{status:400,headers});
 const {requestToken,desktopSecret}=body as Record<string,unknown>;
 if(typeof requestToken!=='string'||!/^[a-f0-9]{64}$/.test(requestToken)||
  typeof desktopSecret!=='string'||!/^[a-f0-9]{64}$/.test(desktopSecret))
  return Response.json({error:'Invalid request'},{status:400,headers});
 try{
  const status=await readQrStatus(requestToken,desktopSecret);
  return Response.json({status},{headers});
 }catch{
  return Response.json({error:'Unavailable'},{status:503,headers});
 }
}
