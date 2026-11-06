import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomBytes,generateKeyPairSync,createHash,sign} from 'node:crypto';
import pg from 'pg';
// Never use DATABASE_URL inherited from a developer machine or production secret.
const testUrl=new URL(process.env.TEST_DATABASE_URL||'http://invalid');
assert.ok(['127.0.0.1','localhost'].includes(testUrl.hostname)&&testUrl.pathname==='/skp_admin_test','Only a disposable loopback skp_admin_test database is permitted');
process.env.DATABASE_URL=testUrl.href;
process.env.SKP_DATABASE_PROVIDER='postgres';
process.env.SKP_ADMIN_REQUIRE_PASSKEY='true';
process.env.ADMIN_PASSWORD='integration-only-not-a-real-secret';
const db=new pg.Pool({connectionString:testUrl.href});
for(const file of ['admin-passkey-schema.sql','admin-roles-schema.sql','admin-employee-invites-schema.sql'])await db.query(readFileSync(new URL('../db/'+file,import.meta.url),'utf8'));
const {createPendingQr}=await import('../lib/admin-qr-pending.ts');
const {issueWebAuthnChallenge}=await import('../lib/admin-webauthn-challenges.ts');
const {verifyAdminPasskeyAssertion}=await import('../lib/admin-passkey-verify.ts');
const {markQrApprovedAfterVerification}=await import('../lib/admin-qr-decision.ts');
const {redeemQrSession}=await import('../lib/admin-qr-session.ts');
const {adminAuthorized,activeSessionOwnerId,issueAdminSession}=await import('../lib/vercel-admin-session.ts');
const {revokeEmployeeAccess}=await import('../lib/admin-employee-revocation.ts');
const {issueEmployeeInvitation}=await import('../lib/admin-employee-invitations.ts');
const {consumeInvitationForVerifiedPasskey}=await import('../lib/admin-employee-passkey-binding.ts');
const {qrChallengeHash}=await import('../lib/admin-qr-challenge.ts');
const origin='https://skpcomp.vercel.app';
const request=new Request(origin+'/api/admin/qr/consume');
const {rows:[owner]}=await db.query("INSERT INTO skp_admin_users(display_name,role) VALUES ('Owner','owner') RETURNING id");
const {rows:[employee]}=await db.query("INSERT INTO skp_admin_users(display_name,role) VALUES ('Employee','admin') RETURNING id");
const {privateKey,publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const jwk=publicKey.export({format:'jwk'});
// COSE EC2 P-256 ES256 public key: {1:2,3:-7,-1:1,-2:x,-3:y}.
const cose=Buffer.concat([Buffer.from([0xa5,1,2,3,0x26,0x20,1,0x21,0x58,32]),Buffer.from(jwk.x,'base64url'),Buffer.from([0x22,0x58,32]),Buffer.from(jwk.y,'base64url')]);
const credentialId=randomBytes(32).toString('base64url');
await db.query('INSERT INTO skp_admin_passkeys(credential_id,public_key,user_id) VALUES ($1,$2,$3)',[credentialId,cose,employee.id]);
function assertion(challenge,{uv=true,assertionOrigin=origin,badSignature=false}={}){
 const client=Buffer.from(JSON.stringify({type:'webauthn.get',challenge:Buffer.from(challenge,'hex').toString('base64url'),origin:assertionOrigin}));
 const auth=Buffer.concat([createHash('sha256').update('skpcomp.vercel.app').digest(),Buffer.from([uv?5:1,0,0,0,0])]);
 const signature=sign('sha256',Buffer.concat([auth,createHash('sha256').update(client).digest()]),privateKey);
 if(badSignature)signature[signature.length-1]^=1;
 return {id:credentialId,rawId:credentialId,type:'public-key',clientExtensionResults:{},response:{clientDataJSON:client.toString('base64url'),authenticatorData:auth.toString('base64url'),signature:signature.toString('base64url')}};
}
const qr=await createPendingQr();
const challenge=await issueWebAuthnChallenge('authenticate',qr.requestToken);
for(const options of [{uv:false},{assertionOrigin:'https://evil.example'},{badSignature:true}]){
 const result=await verifyAdminPasskeyAssertion({response:assertion(challenge.challenge,options),challenge:challenge.challenge,contextId:qr.requestToken,origin}).catch(()=>null);
 assert.equal(result,null);
}
const verified=await verifyAdminPasskeyAssertion({response:assertion(challenge.challenge),challenge:challenge.challenge,contextId:qr.requestToken,origin});
assert.equal(verified?.credentialId,credentialId);
assert.equal(await verifyAdminPasskeyAssertion({response:assertion(challenge.challenge),challenge:challenge.challenge,contextId:qr.requestToken,origin}),null);
assert.equal(await markQrApprovedAfterVerification(qr.requestToken,credentialId),true);
assert.equal(await redeemQrSession(request,qr.requestToken,'f'.repeat(64)),null);
const results=await Promise.all([redeemQrSession(request,qr.requestToken,qr.desktopSecret),redeemQrSession(request,qr.requestToken,qr.desktopSecret)]);
assert.equal(results.filter(Boolean).length,1,'only one desktop redemption');
const cookie=results.find(Boolean);
const authenticated=new Request(origin,{headers:{cookie:cookie.split(';')[0]}});
assert.equal(await adminAuthorized(authenticated),true);
assert.equal(await activeSessionOwnerId(authenticated),null,'admin cannot manage employees');
assert.equal(await issueEmployeeInvitation(employee.id,owner.id),null);
assert.equal(await revokeEmployeeAccess(owner.id,employee.id),false);
// Exercise real HTTP route handlers, including browser binding and CSRF rejection.
const post=(path,body={},extra={})=>new Request(origin+path,{method:'POST',headers:{origin,'content-type':'application/json',...extra},body:JSON.stringify(body)});
const {POST:createRoute}=await import('../app/api/admin/qr/create/route.ts');
const {POST:optionsRoute}=await import('../app/api/admin/qr/options/route.ts');
const {POST:decisionRoute}=await import('../app/api/admin/qr/decision/route.ts');
const {POST:consumeRoute}=await import('../app/api/admin/qr/consume/route.ts');
const {POST:statusRoute}=await import('../app/api/admin/qr/status/route.ts');
// Exercise the real HTTP handlers: arrays, malformed media types and malformed JSON
// must be rejected before any QR state is read or redeemed.
for(const handler of [statusRoute,consumeRoute]){
 assert.equal((await handler(new Request(origin+'/api/admin/qr/check',{method:'POST',headers:{origin,'content-type':'application/json'},body:'[]'}))).status,400);
 assert.equal((await handler(new Request(origin+'/api/admin/qr/check',{method:'POST',headers:{origin,'content-type':'application/json'},body:'{' }))).status,400);
 assert.equal((await handler(new Request(origin+'/api/admin/qr/check',{method:'POST',headers:{origin,'content-type':'application/json-evil'},body:'{}'}))).status,415);
 assert.equal((await handler(new Request(origin+'/api/admin/qr/check',{method:'POST',headers:{origin:'https://evil.example','content-type':'application/json'},body:'{}'}))).status,403);
}

assert.equal((await createRoute(post('/api/admin/qr/create',{}, {origin:'https://evil.example'}))).status,403);
const created=await createRoute(post('/api/admin/qr/create'));
assert.equal(created.status,201);
const flow=await created.json();
assert.ok(!flow.approvalUrl.includes(flow.desktopSecret));
assert.equal((await consumeRoute(post('/api/admin/qr/consume',flow))).status,409);
const options=await (await optionsRoute(post('/api/admin/qr/options',flow))).json();
assert.equal((await decisionRoute(post('/api/admin/qr/decision',{requestToken:flow.requestToken,challenge:options.challenge,response:assertion(options.challenge),approved:true}))).status,200);
const loggedIn=await consumeRoute(post('/api/admin/qr/consume',flow));
assert.equal(loggedIn.status,200);
assert.match(loggedIn.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Strict/);
assert.equal((await consumeRoute(post('/api/admin/qr/consume',flow))).status,409);
const {GET:staffGet,POST:staffPost}=await import('../app/api/admin/staff/route.ts');
assert.equal((await staffGet(authenticated)).status,403);
const ownerCookie=await issueAdminSession(request,owner.id);
const ownerRequest=new Request(origin+'/api/admin/staff',{headers:{cookie:ownerCookie.split(';')[0]}});
assert.equal(await adminAuthorized(ownerRequest),true,'owner database session authorizes admin APIs');
assert.equal(await activeSessionOwnerId(ownerRequest),owner.id,'owner privileges require an active owner session');
assert.equal((await staffGet(ownerRequest)).status,200,'owner can inspect employee management');
assert.equal((await staffGet(new Request(origin+'/api/admin/staff'))).status,403,'unauthenticated callers cannot inspect employees');

assert.equal((await staffPost(post('/api/admin/staff',{action:'create',displayName:'Forbidden'},{cookie:cookie.split(';')[0]}))).status,403);
// Browser-equivalent `fmt:none` WebAuthn attestation through onboarding HTTP routes.
const {POST:inviteOptions}=await import('../app/api/admin/invite/options/route.ts');
const {POST:inviteComplete}=await import('../app/api/admin/invite/complete/route.ts');
const {rows:[registrationUser]}=await db.query("INSERT INTO skp_admin_users(display_name,role) VALUES ('Registered','admin') RETURNING id");
const registrationInvite=await issueEmployeeInvitation(owner.id,registrationUser.id);
const registrationOptions=await (await inviteOptions(post('/api/admin/invite/options',{inviteToken:registrationInvite}))).json();
function cbor(value){
 const head=(major,length)=>length<24?Buffer.from([major*32+length]):length<256?Buffer.from([major*32+24,length]):Buffer.from([major*32+25,length>>8,length&255]);
 if(Buffer.isBuffer(value))return Buffer.concat([head(2,value.length),value]);
 if(typeof value==='string'){const bytes=Buffer.from(value);return Buffer.concat([head(3,bytes.length),bytes])}
 const entries=Object.entries(value);return Buffer.concat([head(5,entries.length),...entries.flatMap(([k,v])=>[cbor(k),cbor(v)])]);
}
const registrationId=randomBytes(32);
const registrationAuth=Buffer.concat([createHash('sha256').update('skpcomp.vercel.app').digest(),Buffer.from([0x45,0,0,0,0]),Buffer.alloc(16),Buffer.from([0,32]),registrationId,cose]);
const registration={id:registrationId.toString('base64url'),rawId:registrationId.toString('base64url'),type:'public-key',clientExtensionResults:{},response:{clientDataJSON:Buffer.from(JSON.stringify({type:'webauthn.create',challenge:Buffer.from(registrationOptions.challenge,'hex').toString('base64url'),origin})).toString('base64url'),attestationObject:cbor({fmt:'none',attStmt:{},authData:registrationAuth}).toString('base64url'),transports:['internal']}};
const registrationBody={inviteToken:registrationInvite,challenge:registrationOptions.challenge,response:registration,deviceLabel:'Test authenticator'};
assert.equal((await inviteComplete(post('/api/admin/invite/complete',registrationBody))).status,200);
assert.equal((await inviteComplete(post('/api/admin/invite/complete',registrationBody))).status,403);
assert.equal((await db.query('SELECT user_id FROM skp_admin_passkeys WHERE credential_id=$1',[registration.id])).rows[0].user_id,registrationUser.id);
// A valid invitation can bind exactly one credential, even with simultaneous completions.
const {rows:[onboard]}=await db.query("INSERT INTO skp_admin_users(display_name,role) VALUES ('Onboarding','admin') RETURNING id");
const onboardingInvite=await issueEmployeeInvitation(owner.id,onboard.id);
assert.deepEqual((await Promise.all(['first','second'].map(id=>consumeInvitationForVerifiedPasskey(onboardingInvite,{credentialId:'onboard-'+id,publicKey:cose,counter:0,transports:[]})))).sort(),[false,true]);
// Failure after consumption must roll back the QR status as well.
const retry=await createPendingQr();
await markQrApprovedAfterVerification(retry.requestToken,credentialId);
process.env.ADMIN_PASSWORD='';
await assert.rejects(redeemQrSession(request,retry.requestToken,retry.desktopSecret));
process.env.ADMIN_PASSWORD='integration-only-not-a-real-secret';
assert.equal((await db.query('SELECT status FROM skp_admin_qr_requests WHERE request_hash=$1',[await qrChallengeHash(retry.requestToken)])).rows[0].status,'approved');
 // A failed session insert must leave a usable approval, not merely an approved row.
 const recoverable=await createPendingQr();
 assert.equal(await markQrApprovedAfterVerification(recoverable.requestToken,credentialId),true);
 process.env.ADMIN_PASSWORD='';
 await assert.rejects(redeemQrSession(request,recoverable.requestToken,recoverable.desktopSecret));
 process.env.ADMIN_PASSWORD='integration-only-not-a-real-secret';
 assert.equal((await db.query('SELECT status FROM skp_admin_qr_requests WHERE request_hash=$1',[await qrChallengeHash(recoverable.requestToken)])).rows[0].status,'approved');
 const recoveredCookie=await redeemQrSession(request,recoverable.requestToken,recoverable.desktopSecret);
 assert.ok(recoveredCookie,'retry must issue a session after the failed transaction rolls back');
 assert.equal((await db.query('SELECT status FROM skp_admin_qr_requests WHERE request_hash=$1',[await qrChallengeHash(recoverable.requestToken)])).rows[0].status,'consumed');
 assert.equal(await redeemQrSession(request,recoverable.requestToken,recoverable.desktopSecret),null,'successful retry remains single-use');
 // Simulate an actual PostgreSQL INSERT failure inside the shared transaction.
 // The trigger is installed only in the disposable loopback test database.
 const insertFailure=await createPendingQr();
 assert.equal(await markQrApprovedAfterVerification(insertFailure.requestToken,credentialId),true);
 await db.query(`CREATE FUNCTION skp_test_fail_session_insert() RETURNS trigger
 LANGUAGE plpgsql AS 'BEGIN RAISE EXCEPTION ''intentional test session insert failure''; END'`);
 await db.query(`CREATE TRIGGER skp_test_reject_session_insert
 BEFORE INSERT ON skp_admin_sessions_v2
 FOR EACH ROW EXECUTE FUNCTION skp_test_fail_session_insert()`);
 try{
  await assert.rejects(redeemQrSession(request,insertFailure.requestToken,insertFailure.desktopSecret),/intentional test session insert failure/);
  assert.equal((await db.query('SELECT status FROM skp_admin_qr_requests WHERE request_hash=$1',[await qrChallengeHash(insertFailure.requestToken)])).rows[0].status,'approved','database insert failure must roll back QR consumption');
 }finally{
  await db.query('DROP TRIGGER skp_test_reject_session_insert ON skp_admin_sessions_v2');
  await db.query('DROP FUNCTION skp_test_fail_session_insert()');
 }
 const retryCookie=await redeemQrSession(request,insertFailure.requestToken,insertFailure.desktopSecret);
 assert.ok(retryCookie,'approval must remain redeemable after an actual PostgreSQL insert failure');
 assert.equal(await redeemQrSession(request,insertFailure.requestToken,insertFailure.desktopSecret),null);


// Deterministic concurrent blocking: hold UPDATE open, start child operations,
// confirm they wait on the row, then commit the block. No timing-only success.
const invite=await issueEmployeeInvitation(owner.id,employee.id);
const blocker=await db.connect();
await blocker.query('BEGIN');
await blocker.query("UPDATE skp_admin_users SET status='blocked',blocked_at=now() WHERE id=$1",[employee.id]);
const pending=[
 issueAdminSession(request,employee.id).then(()=>true,()=>false),
 markQrApprovedAfterVerification((await createPendingQr()).requestToken,credentialId),
 redeemQrSession(request,retry.requestToken,retry.desktopSecret),
 issueEmployeeInvitation(owner.id,employee.id),
 consumeInvitationForVerifiedPasskey(invite,{credentialId:'another-credential',publicKey:cose,counter:0,transports:[]}),
];
let waiting=0;
for(let attempt=0;attempt<100;attempt++){
 const result=await db.query("SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock'");
 waiting=result.rows[0].n;
 if(waiting>=5)break;
 await new Promise(resolve=>setTimeout(resolve,20));
}
assert.equal(waiting,5,'all competing operations must be blocked on the employee lock');
await blocker.query('COMMIT');blocker.release();
assert.deepEqual(await Promise.all(pending),[false,false,null,null,false]);
assert.equal(await adminAuthorized(authenticated),false,'existing cookie is rejected immediately after commit');
// Actual revocation helper cleans all child state.
await db.query("UPDATE skp_admin_users SET status='active',blocked_at=NULL WHERE id=$1",[employee.id]);
assert.equal(await revokeEmployeeAccess(employee.id,owner.id),true);
assert.equal((await db.query('SELECT count(*)::int AS n FROM skp_admin_sessions_v2 WHERE user_id=$1',[employee.id])).rows[0].n,0);
assert.equal((await db.query('SELECT count(*)::int AS n FROM skp_admin_passkeys WHERE user_id=$1 AND revoked_at IS NULL',[employee.id])).rows[0].n,0);
assert.equal(await consumeInvitationForVerifiedPasskey(invite,{credentialId:'blocked',publicKey:cose,counter:0,transports:[]}),false);
assert.equal(await adminAuthorized(authenticated),false);
// An operation already holding the employee lock finishes before block succeeds.
const {withAdminOperation}=await import('../lib/admin-operation.ts');
const {storeEnv}=await import('../db/platform-store.ts');
const onboardCookie=await issueAdminSession(request,onboard.id);
const onboardRequest=new Request(origin,{headers:{cookie:onboardCookie.split(';')[0]}});
let releaseWork,notifyStarted;
const gate=new Promise(resolve=>{releaseWork=resolve});
const started=new Promise(resolve=>{notifyStarted=resolve});
const operation=withAdminOperation(onboardRequest,async()=>{
 notifyStarted();await gate;
 const {DB}=await storeEnv();
 await DB.prepare("INSERT INTO skp_admin_security_events(target_user_id,event_type) VALUES (?::uuid,'login_approved')").bind(onboard.id).run();
 return Response.json({ok:true});
});
await started;
const block=revokeEmployeeAccess(onboard.id,owner.id);
let blockWaiting=false;
for(let attempt=0;attempt<100;attempt++){
 const result=await db.query("SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock'");
 if(result.rows[0].n){blockWaiting=true;break}
 await new Promise(resolve=>setTimeout(resolve,20));
}
assert.equal(blockWaiting,true,'blocking must wait for privileged operation');
releaseWork();
assert.equal((await operation).status,200);
assert.equal(await block,true);
let ran=false;
assert.equal((await withAdminOperation(onboardRequest,async()=>{ran=true;return Response.json({ok:true})})).status,401);
assert.equal(ran,false,'no privileged work starts after blocking');
const events=await db.query("SELECT event_type FROM skp_admin_security_events WHERE target_user_id=$1 AND event_type IN ('login_approved','user_blocked') ORDER BY id",[onboard.id]);
assert.deepEqual(events.rows.map(r=>r.event_type),['login_approved','user_blocked']);
await db.end();
console.log('Real PostgreSQL + signed WebAuthn: QR→assertion→desktop session, replay, UV/origin/signature, rollback, roles, concurrent blocking and cleanup passed.');
