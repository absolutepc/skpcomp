/** Fixed production WebAuthn relying-party identity; never infer it from Host headers. */
export const ADMIN_RP_ID='skpcomp.vercel.app';
export const ADMIN_RP_ORIGIN='https://skpcomp.vercel.app';
export const ADMIN_QR_TTL_SECONDS=60;

/** Explicit isolated staging origin. Never accept wildcard preview hosts or request Host headers. */
function isolatedStagingConfig(origin:string){
 if(process.env.SKP_ADMIN_OWNER_BACKUP_ENROLLMENT!=='staging'||
  process.env.SKP_ADMIN_STAGING_DB_ISOLATED!=='confirmed'||
  process.env.SKP_DATABASE_PROVIDER!=='postgres')return null;
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

/** Defense in depth: staging-only owner backup endpoints must never run on the
 * production RP origin, even if a staging feature flag is set by mistake. */
export function isIsolatedOwnerBackupRequest(request:Request):boolean{
 const origin=request.headers.get('origin');
 if(!origin||origin===ADMIN_RP_ORIGIN)return false;
 const staging=isolatedStagingConfig(origin);
 if(!staging)return false;
 try{return new URL(request.url).origin===staging.origin}catch{return false}
}

/** Off by default. Production opt-in is restricted to the canonical RP and an
 * explicitly identified production runtime; it never changes password login.
 * The existing staging mode remains isolated and cannot enable production.
 */
export function isOwnerBackupRequest(request:Request):boolean{
 if(process.env.SKP_ADMIN_OWNER_BACKUP_ENROLLMENT==='production'){
  return process.env.SKP_DATABASE_PROVIDER==='postgres'&&
   process.env.NODE_ENV==='production'&&process.env.VERCEL_ENV==='production'&&
   request.headers.get('origin')===ADMIN_RP_ORIGIN&&new URL(request.url).origin===ADMIN_RP_ORIGIN;
 }
 return isIsolatedOwnerBackupRequest(request);
}
