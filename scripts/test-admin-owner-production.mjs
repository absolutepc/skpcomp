import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomBytes,generateKeyPairSync,createHash,sign} from 'node:crypto';
import pg from 'pg';
const url=new URL(process.env.TEST_DATABASE_URL||'http://invalid');
assert.ok(['localhost','127.0.0.1'].includes(url.hostname)&&url.pathname==='/skp_admin_test');
Object.assign(process.env,{DATABASE_URL:url.href,SKP_DATABASE_PROVIDER:'postgres',ADMIN_PASSWORD:'owner-production-test',NODE_ENV:'production',VERCEL_ENV:'production',SKP_ADMIN_OWNER_BACKUP_ENROLLMENT:'production'});
delete process.env.SKP_ADMIN_REQUIRE_PASSKEY;
const db=new pg.Pool({connectionString:url.href});
for(const file of ['admin-passkey-schema.sql','admin-roles-schema.sql','admin-employee-invites-schema.sql','admin-owner-step-up-schema.sql','admin-owner-step-up-proof-schema.sql'])await db.query(readFileSync(new URL('../db/'+file,import.meta.url),'utf8'));
const origin='https://skpcomp.vercel.app';
const {issueAdminSession,adminAuthorized,activeOwnerSessionBinding}=await import('../lib/vercel-admin-session.ts');
const {isOwnerBackupRequest}=await import('../lib/admin-passkey-config.ts');
const {POST:options}=await import('../app/api/admin/owner/step-up/options/route.ts');
const {POST:complete}=await import('../app/api/admin/owner/step-up/complete/route.ts');
const {POST:backupOptions}=await import('../app/api/admin/owner/passkeys/options/route.ts');
const {POST:backupComplete}=await import('../app/api/admin/owner/passkeys/complete/route.ts');
const {POST:revoke}=await import('../app/api/admin/owner/passkeys/revoke/route.ts');
const {GET:inventory}=await import('../app/api/admin/owner/passkeys/route.ts');
const {rows:[owner]}=await db.query("INSERT INTO skp_admin_users(display_name,role) VALUES ('Production mode test','owner') RETURNING id");
const cookie=(await issueAdminSession(new Request(origin),owner.id)).split(';')[0];
const otherCookie=(await issueAdminSession(new Request(origin),owner.id)).split(';')[0];
const post=(body={},session=cookie,requestOrigin=origin)=>new Request(origin+'/api/admin/owner',{method:'POST',headers:{origin:requestOrigin,'content-type':'application/json',cookie:session},body:JSON.stringify(body)});
const get=()=>new Request(origin,{headers:{cookie}});
function key(){
 const {privateKey,publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});const jwk=publicKey.export({format:'jwk'});
 const cose=Buffer.concat([Buffer.from([0xa5,1,2,3,0x26,0x20,1,0x21,0x58,32]),Buffer.from(jwk.x,'base64url'),Buffer.from([0x22,0x58,32]),Buffer.from(jwk.y,'base64url')]);
 const id=randomBytes(32).toString('base64url');return {privateKey,cose,id,fingerprint:createHash('md5').update(id).digest('hex')};
}
const primary=key(),backup=key();
await db.query('INSERT INTO skp_admin_passkeys(credential_id,public_key,user_id) VALUES ($1,$2,$3)',[primary.id,primary.cose,owner.id]);
function assertion(k,challenge,{uv=true,wrongOrigin=false,badSignature=false}={}){
 const client=Buffer.from(JSON.stringify({type:'webauthn.get',challenge:Buffer.from(challenge,'hex').toString('base64url'),origin:wrongOrigin?'https://evil.example':origin}));
 const auth=Buffer.concat([createHash('sha256').update('skpcomp.vercel.app').digest(),Buffer.from([uv?5:1,0,0,0,0])]);
 const signature=sign('sha256',Buffer.concat([auth,createHash('sha256').update(client).digest()]),k.privateKey);if(badSignature)signature[signature.length-1]^=1;
 return {id:k.id,rawId:k.id,type:'public-key',clientExtensionResults:{},response:{clientDataJSON:client.toString('base64url'),authenticatorData:auth.toString('base64url'),signature:signature.toString('base64url')}};
}
async function proof(k,action,extra={}){
 const response=await options(post({action,...extra}));assert.equal(response.status,200);const o=await response.json();
 const body={action,...extra,challenge:o.challenge,response:assertion(k,o.challenge)};
 assert.equal((await complete(post(body))).status,200);return body;
}
function cbor(value){
 const head=(m,n)=>n<24?Buffer.from([m*32+n]):n<256?Buffer.from([m*32+24,n]):Buffer.from([m*32+25,n>>8,n&255]);
 if(Buffer.isBuffer(value))return Buffer.concat([head(2,value.length),value]);
 if(typeof value==='string'){const b=Buffer.from(value);return Buffer.concat([head(3,b.length),b])}
 const pairs=Object.entries(value);return Buffer.concat([head(5,pairs.length),...pairs.flatMap(([k,v])=>[cbor(k),cbor(v)])]);
}
// Production must be explicitly opted in and cannot be activated by staging flags.
assert.equal(isOwnerBackupRequest(post()),true);
for(const mode of [undefined,'staging','true']){process.env.SKP_ADMIN_OWNER_BACKUP_ENROLLMENT=mode;assert.equal((await options(post({action:'owner-passkey-enroll'}))).status,404)}
process.env.SKP_ADMIN_OWNER_BACKUP_ENROLLMENT='production';process.env.VERCEL_ENV='preview';assert.equal(isOwnerBackupRequest(post()),false);process.env.VERCEL_ENV='production';
assert.equal(isOwnerBackupRequest(post({},cookie,'https://evil.example')),false);
assert.equal((await backupOptions(post())).status,403,'session without step-up cannot enroll');
const o=await (await options(post({action:'owner-passkey-enroll'}))).json();
for(const invalid of [{uv:false},{wrongOrigin:true},{badSignature:true}])assert.equal((await complete(post({action:'owner-passkey-enroll',challenge:o.challenge,response:assertion(primary,o.challenge,invalid)}))).status,403);
const valid={action:'owner-passkey-enroll',challenge:o.challenge,response:assertion(primary,o.challenge)};
assert.equal((await complete(post(valid,otherCookie))).status,403,'proof cannot cross browser sessions');
assert.equal((await complete(post(valid))).status,200);
assert.equal((await complete(post(valid))).status,403,'proof cannot replay');
const registrationOptions=await (await backupOptions(post())).json();
const idBytes=Buffer.from(backup.id,'base64url');
const authData=Buffer.concat([createHash('sha256').update('skpcomp.vercel.app').digest(),Buffer.from([0x45,0,0,0,0]),Buffer.alloc(16),Buffer.from([0,idBytes.length]),idBytes,backup.cose]);
const registration={id:backup.id,rawId:backup.id,type:'public-key',clientExtensionResults:{},response:{clientDataJSON:Buffer.from(JSON.stringify({type:'webauthn.create',challenge:Buffer.from(registrationOptions.challenge,'hex').toString('base64url'),origin})).toString('base64url'),attestationObject:cbor({fmt:'none',attStmt:{},authData}).toString('base64url'),transports:['internal']}};
assert.equal((await backupComplete(post({challenge:registrationOptions.challenge,response:registration,deviceLabel:'Backup'}))).status,200);
assert.equal((await inventory(get())).status,200);
assert.equal((await (await inventory(get())).json()).backupVerified,false,'registration is not proof of backup usability');
const testOptions=await (await options(post({action:'owner-passkey-test',fingerprint:backup.fingerprint}))).json();
assert.equal((await complete(post({action:'owner-passkey-test',fingerprint:backup.fingerprint,challenge:testOptions.challenge,response:assertion(primary,testOptions.challenge)}))).status,403,'server enforces the selected key, not just browser allowCredentials');
await proof(backup,'owner-passkey-test',{fingerprint:backup.fingerprint});
assert.equal((await (await inventory(get())).json()).backupVerified,true);
assert.equal((await backupOptions(post())).status,403,'testing a key never authorizes enrollment');
await proof(primary,'owner-passkey-revoke');
assert.equal((await revoke(post({fingerprint:primary.fingerprint}))).status,403,'cannot revoke the proof key and leave an unproven survivor');
const selection=await (await options(post({action:'owner-passkey-revoke',fingerprint:primary.fingerprint}))).json();
assert.deepEqual(selection.allowCredentials.map(k=>k.id),[backup.id]);
await proof(backup,'owner-passkey-revoke');
const revocations=await Promise.all([revoke(post({fingerprint:primary.fingerprint})),revoke(post({fingerprint:primary.fingerprint}))]);
assert.deepEqual(revocations.map(r=>r.status).sort(),[200,403],'concurrent revocation has one winner');
assert.equal(await adminAuthorized(get()),false,'all existing owner sessions are invalidated');
assert.equal(await adminAuthorized(new Request(origin,{headers:{cookie:otherCookie}})),false);
assert.equal((await db.query('SELECT count(*)::int AS n FROM skp_admin_owner_step_up_grants WHERE owner_user_id=$1',[owner.id])).rows[0].n,0);
const remaining=(await issueAdminSession(new Request(origin),owner.id)).split(';')[0];
assert.equal((await revoke(post({fingerprint:backup.fingerprint},remaining))).status,403,'last key cannot be revoked');
// Legacy password fallback stays usable and independent of owner-management grants.
const {POST:store}=await import('../app/api/store/route.ts');
assert.equal((await store(post({action:'login',password:process.env.ADMIN_PASSWORD},''))).status,200);
const legacy='skp_admin='+createHash('sha256').update('skp-session:'+process.env.ADMIN_PASSWORD).digest('hex');
const {withAdminOperation}=await import('../lib/admin-operation.ts');
assert.equal((await withAdminOperation(post({},legacy),async()=>Response.json({ok:true}))).status,200,'password administrative operations remain available');
assert.equal((await withAdminOperation(get(),async()=>Response.json({ok:true}))).status,401,'revoked session cannot perform administrative work');
assert.equal((await options(post({action:'owner-passkey-enroll'},legacy))).status,403,'shared password must not grant owner management');
await db.query('DELETE FROM skp_admin_sessions_v2 WHERE user_id=$1',[owner.id]);
await db.query('DELETE FROM skp_admin_passkeys WHERE user_id=$1',[owner.id]);
await db.query('DELETE FROM skp_admin_security_events WHERE actor_user_id=$1 OR target_user_id=$1',[owner.id]);
await db.query('DELETE FROM skp_admin_users WHERE id=$1',[owner.id]);
await db.end();
console.log('Production owner mode: crypto step-up, backup registration/test, survivor proof, session invalidation and password fallback passed.');
