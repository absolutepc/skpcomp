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
 const contextA=ownerStepUpContext(bindingA.ownerId,bindingA.sessionHash);
 const contextB=ownerStepUpContext(bindingB.ownerId,bindingB.sessionHash);
 const stepUpChallenge=await issueWebAuthnChallenge('authenticate',contextA);
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
 await pool.query('DELETE FROM skp_admin_webauthn_challenges WHERE request_id=$1',[contextA]);
 await pool.query('DELETE FROM skp_admin_owner_step_up_grants WHERE owner_user_id=$1',[owner.id]);
 await pool.query('DELETE FROM skp_admin_sessions_v2 WHERE user_id=$1',[owner.id]);
 await pool.query('DELETE FROM skp_admin_users WHERE id=$1',[owner.id]);
 console.log('Owner step-up PostgreSQL: session/action scope, atomic concurrency, replay, rollback and expiry passed.');
}finally{await pool.end()}
