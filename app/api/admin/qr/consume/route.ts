import {isTrustedAdminOrigin} from '../../../../../lib/admin-passkey-config';
import {consumeApprovedQr} from '../../../../../lib/admin-qr-consume';
import {issueAdminSession} from '../../../../../lib/vercel-admin-session';

export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
export async function POST(request:Request){
 if(!isTrustedAdminOrigin(request))
  return Response.json({error:'Forbidden'},{status:403,headers});
 if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')
  return Response.json({error:'Unsupported content type'},{status:415,headers});
 const raw=await request.text();
 if(raw.length>1024)return Response.json({error:'Invalid request'},{status:400,headers});
 let input:unknown;
 try{input=JSON.parse(raw)}catch{return Response.json({error:'Invalid request'},{status:400,headers})}
 if(!input||typeof input!=='object')
  return Response.json({error:'Invalid request'},{status:400,headers});
 const {requestToken,desktopSecret}=input as Record<string,unknown>;
 if(typeof requestToken!=='string'||!/^[a-f0-9]{64}$/.test(requestToken)||
  typeof desktopSecret!=='string'||!/^[a-f0-9]{64}$/.test(desktopSecret))
  return Response.json({error:'Invalid request'},{status:400,headers});
 try{
  const employeeId=await consumeApprovedQr(requestToken,desktopSecret);
  if(!employeeId)
   return Response.json({error:'Not approved or already used'},{status:409,headers});
  const cookie=await issueAdminSession(request,employeeId);
  return Response.json({authenticated:true},{headers:{...headers,'Set-Cookie':cookie}});
 }catch{
  return Response.json({error:'Unavailable'},{status:503,headers});
 }
}
