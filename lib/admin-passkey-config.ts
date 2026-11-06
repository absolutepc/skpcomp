/** Fixed production WebAuthn relying-party identity; never infer it from Host headers. */
export const ADMIN_RP_ID='skpcomp.vercel.app';
export const ADMIN_RP_ORIGIN='https://skpcomp.vercel.app';
export const ADMIN_QR_TTL_SECONDS=60;

/** Explicit isolated staging origin. Never accept wildcard preview hosts or request Host headers. */
function isolatedStagingConfig(origin:string){
 if(process.env.SKP_ADMIN_OWNER_BACKUP_ENROLLMENT!=='staging')return null;
 const configured=process.env.SKP_ADMIN_STAGING_ORIGIN;
 if(!configured||configured===ADMIN_RP_ORIGIN||!/^https:\/\/[^/]+$/.test(configured)||configured!==origin)return null;
 try{
  const url=new URL(configured);
  if(url.username||url.password||url.port||url.hostname==='localhost'||url.hostname==='127.0.0.1'||url.hostname===ADMIN_RP_ID)return null;
  return {rpID:url.hostname,origin:configured};
 }catch{return null;}
}

export function adminWebAuthnConfig(origin:string){
 const staging=isolatedStagingConfig(origin);
 if(staging)return staging;
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
