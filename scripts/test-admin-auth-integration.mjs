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
// Failure after consumption must roll back the QR status as well.
const retry=await createPendingQr();
await markQrApprovedAfterVerification(retry.requestToken,credentialId);
process.env.ADMIN_PASSWORD='';
await assert.rejects(redeemQrSession(request,retry.requestToken,retry.desktopSecret));
process.env.ADMIN_PASSWORD='integration-only-not-a-real-secret';
assert.equal((await db.query('SELECT status FROM skp_admin_qr_requests WHERE request_hash=$1',[await qrChallengeHash(retry.requestToken)])).rows[0].status,'approved');
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
await db.end();
console.log('Real PostgreSQL + signed WebAuthn: QR→assertion→desktop session, replay, UV/origin/signature, rollback, roles, concurrent blocking and cleanup passed.');
