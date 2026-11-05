/** Fixed production WebAuthn relying-party identity; never infer it from Host headers. */
export const ADMIN_RP_ID='skpcomp.vercel.app';
export const ADMIN_RP_ORIGIN='https://skpcomp.vercel.app';
export const ADMIN_QR_TTL_SECONDS=60;

export function adminWebAuthnConfig(origin:string){
  if(origin===ADMIN_RP_ORIGIN)return {rpID:ADMIN_RP_ID,origin:ADMIN_RP_ORIGIN};
  // Loopback is exclusively for local development, not LAN HTTP.
  if(process.env.NODE_ENV==='development' && (origin==='http://localhost:5173'||origin==='http://127.0.0.1:5173'))
    return {rpID:new URL(origin).hostname,origin};
  throw new Error('Unsupported WebAuthn origin');
}

export function isTrustedAdminOrigin(request:Request):boolean{
  const origin=request.headers.get('origin');
  if(!origin)return false;
  try{return adminWebAuthnConfig(origin).origin===new URL(request.url).origin}catch{return false}
}
