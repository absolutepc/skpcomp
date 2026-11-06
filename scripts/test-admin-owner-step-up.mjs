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
