import {storeEnv} from '../db/platform-store';
import {adminCookie} from './admin-cookie';
import {localAdminAccess} from './local-admin-access';

const SESSION_SECONDS=8*60*60;
const SESSION_COOKIE=/^(?:skp_admin)=([a-f0-9]{64})$/;
const randomToken=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
const hash=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
const now=()=>Math.floor(Date.now()/1000);
const sessionFromRequest=(r:Request)=>{
 const part=(r.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>SESSION_COOKIE.test(x));
 return part?.match(SESSION_COOKIE)?.[1]||null;
};
async function database(){
 const {DB}=await storeEnv();
 await DB.prepare('CREATE TABLE IF NOT EXISTS skp_admin_sessions_v2 (token_hash TEXT PRIMARY KEY, expires INTEGER NOT NULL)').run();
 return DB;
}
export async function adminAuthorized(request:Request){
 if(localAdminAccess(request))return true;
 const token=sessionFromRequest(request);
 if(!token)return false;
 const {ADMIN_PASSWORD}=await storeEnv();
 if(!ADMIN_PASSWORD)return false;
 const DB=await database();
 return !!await DB.prepare('SELECT token_hash FROM skp_admin_sessions_v2 WHERE token_hash=? AND expires>?')
   .bind(await hash('skp-admin-v2:'+ADMIN_PASSWORD+':'+token),now()).first();
}
export async function issueAdminSession(request:Request){
 const {ADMIN_PASSWORD}=await storeEnv();
 if(!ADMIN_PASSWORD)throw new Error('Admin password not configured');
 const DB=await database();
 const token=randomToken();
 await DB.prepare('INSERT INTO skp_admin_sessions_v2 (token_hash,expires) VALUES (?,?)')
  .bind(await hash('skp-admin-v2:'+ADMIN_PASSWORD+':'+token),now()+SESSION_SECONDS).run();
 return adminCookie(request,token,SESSION_SECONDS);
}
export async function revokeAdminSession(request:Request){
 const token=sessionFromRequest(request);
 if(token){
  const {ADMIN_PASSWORD}=await storeEnv();
  if(ADMIN_PASSWORD){
   const DB=await database();
   await DB.prepare('DELETE FROM skp_admin_sessions_v2 WHERE token_hash=?')
    .bind(await hash('skp-admin-v2:'+ADMIN_PASSWORD+':'+token)).run();
  }
 }
 return adminCookie(request,'',0);
}
