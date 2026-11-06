import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

// Static security regression checks. These do not replace PostgreSQL concurrency tests.
const registration=readFileSync(new URL('../lib/admin-owner-backup-registration.ts',import.meta.url),'utf8');
const grants=readFileSync(new URL('../lib/admin-owner-step-up-grants.ts',import.meta.url),'utf8');
const challenges=readFileSync(new URL('../lib/admin-webauthn-challenges.ts',import.meta.url),'utf8');
const transactions=readFileSync(new URL('../db/platform-store.ts',import.meta.url),'utf8');

test('backup enrollment uses a transaction and rolls back failures',()=>{
 assert.match(registration,/await adminTransaction\(async\(\)=>\{/);
 assert.match(registration,/catch\s*\{\s*return false;\s*\}/);
 for(const reason of ['Owner session invalid','Step-up grant invalid','Challenge invalid','Registration incomplete']){
  assert.ok(registration.includes("throw new Error('"+reason+"')"),reason);
 }
 assert.match(transactions,/await client\.query\('ROLLBACK'\)/);
});

test('grant is single-use, session scoped, action scoped and expires',()=>{
 assert.match(grants,/SET consumed_at=now\(\)/);
 assert.match(grants,/session_token_hash=\?/);
 assert.match(grants,/action=\?/);
 assert.match(grants,/consumed_at IS NULL AND expires_at>now\(\)/);
 assert.match(grants,/FOR UPDATE/);
});

test('challenge is single-use and expires',()=>{
 assert.match(challenges,/SET consumed_at=now\(\)/);
 assert.match(challenges,/consumed_at IS NULL AND expires_at>now\(\)/);
 assert.match(challenges,/RETURNING challenge_hash/);
});

test('registration verifies origin, RP ID and user presence verification',()=>{
 assert.match(registration,/verifyRegistrationResponse\(/);
 assert.match(registration,/expectedOrigin:config\.origin/);
 assert.match(registration,/expectedRPID:config\.rpID/);
 assert.match(registration,/requireUserVerification:true/);
});


test('owner step-up challenges are bound to the current session',()=>{
 const options=readFileSync(new URL('../app/api/admin/owner/step-up/options/route.ts',import.meta.url),'utf8');
 const verification=readFileSync(new URL('../lib/admin-owner-step-up.ts',import.meta.url),'utf8');
 assert.match(options,/activeOwnerSessionBinding\(request\)/);
 assert.match(options,/ownerStepUpContext\(binding\.ownerId,binding\.sessionHash,action as OwnerStepUpAction\)/);
 assert.match(verification,/ownerStepUpContext\(ownerId,binding\.sessionHash,input\.action\)/);
 assert.match(verification,/current\.sessionHash!==binding\.sessionHash/);
 assert.doesNotMatch(options,/['"]owner-step-up:['"]\+ownerId/);
});


test('backup enrollment challenges are session bound without recursive context construction',()=>{
 const options=readFileSync(new URL('../app/api/admin/owner/passkeys/options/route.ts',import.meta.url),'utf8');
 assert.match(options,/ownerBackupChallengeContext\(binding\.ownerId,binding\.sessionHash\)/);
 assert.match(registration,/ownerBackupChallengeContext\(ownerId,binding\.sessionHash\)/);
 assert.match(registration,/const current=await activeOwnerSessionBinding\(input\.request\)/);
 assert.match(registration,/current\.sessionHash!==binding\.sessionHash/);
 assert.match(registration,/ownerBackupChallengeContext=\(ownerId:string,sessionHash:string\):string=>'owner-backup:'\+ownerId\+':'\+sessionHash/);
});


test('owner UI requests matching WebAuthn action for each privileged operation',()=>{
 const page=readFileSync(new URL('../app/admin/owner/passkeys/page.tsx',import.meta.url),'utf8');
 const revoke=page.slice(page.indexOf('async function revoke('),page.indexOf('async function addBackup('));
 const enroll=page.slice(page.indexOf('async function addBackup('),page.indexOf('useEffect(()=>'));
 for(const [source,action] of [[revoke,'owner-passkey-revoke'],[enroll,'owner-passkey-enroll']]){
  assert.ok(source.includes("post('/api/admin/owner/step-up/options',{action:'"+action+"'"));
  assert.ok(source.includes("post('/api/admin/owner/step-up/complete',{action:'"+action+"'"));
 }
});


test('owner revocation preserves last credential and rejects ambiguous fingerprints',()=>{
 const source=readFileSync(new URL('../lib/admin-owner-passkey-revocation.ts',import.meta.url),'utf8');
 assert.match(source,/keys\.length<2/);
 assert.match(source,/keys\.filter\(key=>key\.fingerprint===credentialFingerprint\)\.length!==1/);
 assert.match(source,/updated\.results\.length!==1/);
 assert.match(source,/await adminTransaction\(async\(\)=>\{/);
 assert.match(source,/consumeSessionOwnerStepUpGrantInTransaction\(request,'owner-passkey-revoke',credentialFingerprint\)/);
});

test('owner step-up challenge API rejects non-JSON and oversized requests',()=>{
 const source=readFileSync(new URL('../app/api/admin/owner/step-up/options/route.ts',import.meta.url),'utf8');
 assert.match(source,/request\.headers\.get\('content-type'\)/);
 assert.match(source,/raw\.length>1024/);
 assert.match(source,/JSON\.parse\(raw\)/);
 assert.match(source,/Array\.isArray\(body\)/);
});

test('owner backup routes require an explicit origin-specific mode',()=>{
 const routes=[
  'app/api/admin/owner/step-up/options/route.ts',
  'app/api/admin/owner/step-up/complete/route.ts',
  'app/api/admin/owner/passkeys/options/route.ts',
  'app/api/admin/owner/passkeys/complete/route.ts',
  'app/api/admin/owner/passkeys/revoke/route.ts',
 ];
 for(const path of routes){
  const source=readFileSync(new URL('../'+path,import.meta.url),'utf8');
  assert.match(source,/isOwnerBackupRequest\(request\)/,path);
  assert.match(source,/status:404/,path);
  assert.match(source,/isTrustedAdminOrigin\(request\)/,path);
 }
 const config=readFileSync(new URL('../lib/admin-passkey-config.ts',import.meta.url),'utf8');
 assert.match(config,/SKP_ADMIN_STAGING_DB_ISOLATED\s*!==\s*'confirmed'/);
 assert.match(config,/configured===ADMIN_RP_ORIGIN/);
 assert.match(config,/url\.hostname===ADMIN_RP_ID/);
 assert.match(config,/if\(!origin\|\|origin===ADMIN_RP_ORIGIN\)return false/);
 assert.match(config,/new URL\(request.url\).origin===staging.origin/);
});
