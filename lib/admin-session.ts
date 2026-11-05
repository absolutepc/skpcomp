import {env} from 'cloudflare:workers';
import {adminCookie} from './admin-cookie';

const settings=env as unknown as {DB:D1Database;ADMIN_PASSWORD?:string};
export async function digest(text:string){
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
 return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
}
const cookie=(r:Request)=>r.headers.get('cookie')?.match(/(?:^|;\s*)skp_admin=([a-f0-9]{64})(?:;|$)/)?.[1];
async function sessions(){
 await settings.DB.prepare('CREATE TABLE IF NOT EXISTS admin_sessions (token TEXT PRIMARY KEY, expires INTEGER NOT NULL)').run();
}
async function sessionHash(token:string){return digest(settings.ADMIN_PASSWORD+':session:'+token)}
export async function authorized(r:Request){
 const token=cookie(r);
 if(!token||!settings.ADMIN_PASSWORD)return false;
 await sessions();
 return !!await settings.DB.prepare('SELECT 1 FROM admin_sessions WHERE token=? AND expires>unixepoch()').bind(await sessionHash(token)).first();
}
export async function login(r:Request,password:unknown){
 const db=settings.DB;
 await db.prepare('CREATE TABLE IF NOT EXISTS login_attempts (bucket TEXT PRIMARY KEY, attempts INTEGER, expires INTEGER)').run();
 const bucket=await digest('login:'+ (r.headers.get('cf-connecting-ip')||'shared'));
 const attempt=await db.prepare('INSERT INTO login_attempts VALUES (?,1,unixepoch()+900) ON CONFLICT(bucket) DO UPDATE SET attempts=CASE WHEN expires<=unixepoch() THEN 1 ELSE attempts+1 END, expires=CASE WHEN expires<=unixepoch() THEN unixepoch()+900 ELSE expires END RETURNING attempts').bind(bucket).first<{attempts:number}>();
 if(!attempt||attempt.attempts>8)return Response.json({error:'Слишком много попыток. Повторите через 15 минут.'},{status:429});
 if(!settings.ADMIN_PASSWORD||password!==settings.ADMIN_PASSWORD)return Response.json({error:'Неверный пароль'},{status:401});
 const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
 await sessions();
 await db.batch([db.prepare('DELETE FROM admin_sessions WHERE expires<=unixepoch()'),db.prepare('DELETE FROM login_attempts WHERE bucket=? OR expires<=unixepoch()').bind(bucket),db.prepare('INSERT INTO admin_sessions VALUES (?,unixepoch()+28800)').bind(await sessionHash(token))]);
 return Response.json({ok:true},{headers:{'Set-Cookie':adminCookie(r,token,28800)}});
}
export async function logout(r:Request){
 const token=cookie(r);
 if(token){await sessions();await settings.DB.prepare('DELETE FROM admin_sessions WHERE token=?').bind(await sessionHash(token)).run()}
 return Response.json({ok:true},{headers:{'Set-Cookie':adminCookie(r,'',0)}});
}
