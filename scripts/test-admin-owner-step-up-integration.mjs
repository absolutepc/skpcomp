import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import pg from 'pg';

// Refuse production or remote databases, even if DATABASE_URL is set.
const url=new URL(process.env.TEST_DATABASE_URL||'http://invalid');
assert.ok(['localhost','127.0.0.1'].includes(url.hostname)&&url.pathname==='/skp_admin_test',
 'Only the disposable loopback skp_admin_test database is allowed');
process.env.DATABASE_URL=url.href;
process.env.SKP_DATABASE_PROVIDER='postgres';
process.env.ADMIN_PASSWORD='owner-step-up-integration-only';
const pool=new pg.Pool({connectionString:url.href});
try{
 for(const file of ['admin-passkey-schema.sql','admin-roles-schema.sql','admin-owner-step-up-schema.sql'])
  await pool.query(readFileSync(new URL('../db/'+file,import.meta.url),'utf8'));
 const {issueAdminSession}=await import('../lib/vercel-admin-session.ts');
 const {adminTransaction}=await import('../db/platform-store.ts');
 const {issueOwnerStepUpGrantAfterVerifiedAssertion,consumeSessionOwnerStepUpGrantInTransaction}=await import('../lib/admin-owner-step-up-grants.ts');
 const origin='https://skpcomp.vercel.app';
 const {rows:[owner]}=await pool.query("INSERT INTO skp_admin_users(display_name,role) VALUES ('Owner step-up integration','owner') RETURNING id");
 const base=new Request(origin);
 const cookieA=await issueAdminSession(base,owner.id);
 const cookieB=await issueAdminSession(base,owner.id);
 const requestA=new Request(origin,{headers:{cookie:cookieA.split(';')[0]}});
 const requestB=new Request(origin,{headers:{cookie:cookieB.split(';')[0]}});
 // The authentication challenge itself must not be redeemable from a second owner session.
 const {activeOwnerSessionBinding}=await import('../lib/vercel-admin-session.ts');
 const {ownerStepUpContext}=await import('../lib/admin-owner-step-up.ts');
 const {issueWebAuthnChallenge,consumeWebAuthnChallenge}=await import('../lib/admin-webauthn-challenges.ts');
 const bindingA=await activeOwnerSessionBinding(requestA);
 const bindingB=await activeOwnerSessionBinding(requestB);
 assert.ok(bindingA&&bindingB&&bindingA.sessionHash!==bindingB.sessionHash);
 const contextA=ownerStepUpContext(bindingA.ownerId,bindingA.sessionHash,'owner-passkey-enroll');
 const contextB=ownerStepUpContext(bindingB.ownerId,bindingB.sessionHash,'owner-passkey-enroll');
 const contextRevoke=ownerStepUpContext(bindingA.ownerId,bindingA.sessionHash,'owner-passkey-revoke');
 // Backup registration challenge must also be isolated across owner sessions.
 const {ownerBackupChallengeContext}=await import('../lib/admin-owner-backup-registration.ts');
 const backupContextA=ownerBackupChallengeContext(bindingA.ownerId,bindingA.sessionHash);
 const backupContextB=ownerBackupChallengeContext(bindingB.ownerId,bindingB.sessionHash);
 const backupChallenge=await issueWebAuthnChallenge('register',backupContextA);
 assert.equal(await adminTransaction(()=>consumeWebAuthnChallenge(backupChallenge.challenge,'register',backupContextB)),false,'backup challenge cannot cross sessions');
 assert.equal(await adminTransaction(()=>consumeWebAuthnChallenge(backupChallenge.challenge,'register',backupContextA)),true,'initiating session can consume backup challenge');
 assert.equal(await adminTransaction(()=>consumeWebAuthnChallenge(backupChallenge.challenge,'register',backupContextA)),false,'backup challenge replay denied');
 const stepUpChallenge=await issueWebAuthnChallenge('authenticate',contextA);
 assert.equal(await adminTransaction(()=>consumeWebAuthnChallenge(stepUpChallenge.challenge,'authenticate',contextRevoke)),false,'challenge cannot authorize another action');
 assert.equal(await adminTransaction(()=>consumeWebAuthnChallenge(stepUpChallenge.challenge,'authenticate',contextB)),false,'other session cannot consume owner challenge');
 assert.equal(await adminTransaction(()=>consumeWebAuthnChallenge(stepUpChallenge.challenge,'authenticate',contextA)),true,'original session can consume owner challenge');
 assert.equal(await adminTransaction(()=>consumeWebAuthnChallenge(stepUpChallenge.challenge,'authenticate',contextA)),false,'owner challenge replay denied');
 const action='owner-passkey-enroll';
 const grant=await issueOwnerStepUpGrantAfterVerifiedAssertion(requestA,action);
 assert.match(grant,/^[a-f0-9]{64}$/);
 assert.equal(await adminTransaction(()=>consumeSessionOwnerStepUpGrantInTransaction(requestB,action)),false,'grant must not cross sessions');
 assert.equal(await adminTransaction(()=>consumeSessionOwnerStepUpGrantInTransaction(requestA,'owner-passkey-revoke')),false,'grant must not cross actions');
 // Two transactions contend for the same grant: exactly one may consume it.
 const concurrent=await Promise.all([
  adminTransaction(()=>consumeSessionOwnerStepUpGrantInTransaction(requestA,action)),
  adminTransaction(()=>consumeSessionOwnerStepUpGrantInTransaction(requestA,action)),
 ]);
 assert.deepEqual(concurrent.sort(),[false,true],'single-use grant must be atomic');
 assert.equal(await adminTransaction(()=>consumeSessionOwnerStepUpGrantInTransaction(requestA,action)),false,'replay must fail');
 // Failed privileged mutation must restore the grant through rollback.
 const rollbackGrant=await issueOwnerStepUpGrantAfterVerifiedAssertion(requestA,action);
 assert.ok(rollbackGrant);
 await assert.rejects(adminTransaction(async()=>{
  assert.equal(await consumeSessionOwnerStepUpGrantInTransaction(requestA,action),true);
  throw new Error('simulate failed credential insertion');
 }),/simulate failed credential insertion/);
 assert.equal(await adminTransaction(()=>consumeSessionOwnerStepUpGrantInTransaction(requestA,action)),true,'rollback restores grant');
 const expired=await issueOwnerStepUpGrantAfterVerifiedAssertion(requestA,action);
 assert.ok(expired);
 await pool.query("UPDATE skp_admin_owner_step_up_grants SET created_at=now()-interval '5 minutes', expires_at=now()-interval '1 second' WHERE grant_hash IN (SELECT grant_hash FROM skp_admin_owner_step_up_grants WHERE owner_user_id=$1 AND consumed_at IS NULL)",[owner.id]);
 assert.equal(await adminTransaction(()=>consumeSessionOwnerStepUpGrantInTransaction(requestA,action)),false,'expired grant must fail');
 // Revocation is atomic and must never remove the last usable owner credential.
 const {revokeOwnerPasskey}=await import('../lib/admin-owner-passkey-revocation.ts');
 const {rows:[keyA]}=await pool.query("INSERT INTO skp_admin_passkeys(credential_id,public_key,user_id,device_label) VALUES ('owner-test-key-a',decode('01020304050607080910111213141516','hex'),$1,'Primary') RETURNING md5(credential_id) AS fingerprint",[owner.id]);
 const {rows:[keyB]}=await pool.query("INSERT INTO skp_admin_passkeys(credential_id,public_key,user_id,device_label) VALUES ('owner-test-key-b',decode('01020304050607080910111213141516','hex'),$1,'Backup') RETURNING md5(credential_id) AS fingerprint",[owner.id]);
 // This exercises the post-verification QR approval/redemption path with the backup
 // credential. It does NOT simulate or replace a cryptographic WebAuthn assertion.
 const {createPendingQr}=await import('../lib/admin-qr-pending.ts');
 const {markQrApprovedAfterVerification}=await import('../lib/admin-qr-decision.ts');
 const {consumeApprovedQr}=await import('../lib/admin-qr-consume.ts');
 const backupQr=await createPendingQr();
 assert.equal(await markQrApprovedAfterVerification(backupQr.requestToken,'owner-test-key-b'),true,'active backup credential can approve after WebAuthn verification');
 assert.equal(await consumeApprovedQr(backupQr.requestToken,'0'.repeat(64)),null,'wrong desktop secret cannot redeem backup login');
 assert.equal(await consumeApprovedQr(backupQr.requestToken,backupQr.desktopSecret),owner.id,'approved backup credential redeems for owner');
 assert.equal(await consumeApprovedQr(backupQr.requestToken,backupQr.desktopSecret),null,'backup QR redemption is single-use');
 // Full desktop redemption issues a fresh database-backed session, not merely a user ID.
 const {redeemQrSession}=await import('../lib/admin-qr-session.ts');
 const {adminAuthorized,activeSessionOwnerId}=await import('../lib/vercel-admin-session.ts');
 const loginQr=await createPendingQr();
 assert.equal(await markQrApprovedAfterVerification(loginQr.requestToken,'owner-test-key-b'),true);
 const freshDesktop=new Request(origin,{headers:{origin}});
 assert.equal(await redeemQrSession(freshDesktop,loginQr.requestToken,'0'.repeat(64)),null,'invalid desktop secret cannot create session');
 const loginCookie=await redeemQrSession(freshDesktop,loginQr.requestToken,loginQr.desktopSecret);
 assert.ok(loginCookie?.includes('skp_admin='),'successful backup QR redemption issues a cookie');
 const freshAuthenticated=new Request(origin,{headers:{cookie:loginCookie.split(';')[0]}});
 assert.equal(await adminAuthorized(freshAuthenticated),true,'new session is authorized without existing owner cookie');
 assert.equal(await activeSessionOwnerId(freshAuthenticated),owner.id,'new QR session resolves to correct owner');
 assert.equal(await redeemQrSession(freshDesktop,loginQr.requestToken,loginQr.desktopSecret),null,'QR cannot issue a second session');
 // Concurrent redemption from independent desktop requests must yield exactly one session.
 const racingQr=await createPendingQr();
 assert.equal(await markQrApprovedAfterVerification(racingQr.requestToken,'owner-test-key-b'),true);
 const racing=await Promise.all([
  redeemQrSession(new Request(origin,{headers:{origin}}),racingQr.requestToken,racingQr.desktopSecret),
  redeemQrSession(new Request(origin,{headers:{origin}}),racingQr.requestToken,racingQr.desktopSecret),
 ]);
 assert.equal(racing.filter(Boolean).length,1,'concurrent QR redemption issues only one session');

 const revokedQr=await createPendingQr();
 assert.equal(await markQrApprovedAfterVerification(revokedQr.requestToken,'owner-test-key-b'),true);
 assert.equal(await revokeOwnerPasskey(requestA,keyB.fingerprint),false,'revocation requires a fresh action-specific grant');
 await issueOwnerStepUpGrantAfterVerifiedAssertion(requestA,'owner-passkey-revoke');
 assert.equal(await revokeOwnerPasskey(requestB,keyB.fingerprint),false,'another owner session cannot revoke');
 assert.equal(await revokeOwnerPasskey(requestA,keyB.fingerprint),true,'verified owner may revoke backup');
 assert.equal(await consumeApprovedQr(revokedQr.requestToken,revokedQr.desktopSecret),null,'revoked backup credential cannot redeem even previously approved QR');
 const afterRevokeQr=await createPendingQr();
 assert.equal(await markQrApprovedAfterVerification(afterRevokeQr.requestToken,'owner-test-key-b'),false,'revoked backup credential cannot approve a new QR');
 assert.equal(await consumeApprovedQr(afterRevokeQr.requestToken,afterRevokeQr.desktopSecret),null,'unapproved QR cannot create a session');
 assert.equal(await revokeOwnerPasskey(requestA,keyB.fingerprint),false,'revocation replay must fail');
 await issueOwnerStepUpGrantAfterVerifiedAssertion(requestA,'owner-passkey-revoke');
 assert.equal(await revokeOwnerPasskey(requestA,keyA.fingerprint),false,'last active owner key must be protected');
 const {rows:[state]}=await pool.query("SELECT count(*) FILTER(WHERE revoked_at IS NULL)::int AS active,count(*) FILTER(WHERE revoked_at IS NOT NULL)::int AS revoked FROM skp_admin_passkeys WHERE user_id=$1",[owner.id]);
 assert.equal(state.active,1);assert.equal(state.revoked,1);
 await pool.query("DELETE FROM skp_admin_qr_requests WHERE approved_credential_id IN ('owner-test-key-a','owner-test-key-b')");
 await pool.query('DELETE FROM skp_admin_passkeys WHERE user_id=$1',[owner.id]);
 await pool.query('DELETE FROM skp_admin_webauthn_challenges WHERE request_id IN ($1,$2)',[contextA,backupContextA]);
 await pool.query('DELETE FROM skp_admin_owner_step_up_grants WHERE owner_user_id=$1',[owner.id]);
 await pool.query('DELETE FROM skp_admin_sessions_v2 WHERE user_id=$1',[owner.id]);
 await pool.query('DELETE FROM skp_admin_security_events WHERE actor_user_id=$1 OR target_user_id=$1',[owner.id]);
 await pool.query('DELETE FROM skp_admin_users WHERE id=$1',[owner.id]);
 console.log('Owner step-up PostgreSQL: session/action scope, atomic concurrency, replay, rollback and expiry passed.');
}finally{await pool.end()}
