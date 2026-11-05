import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../lib/admin-webauthn-challenges.ts',import.meta.url),'utf8');
const schema=readFileSync(new URL('../db/admin-passkey-schema.sql',import.meta.url),'utf8');

assert.match(source,/CHALLENGE_LIFETIME_SECONDS=120/);
assert.match(source,/newQrChallenge\(\)/);
assert.match(source,/qrChallengeHash\(challenge\)/);
assert.match(source,/contextId\.length>256/);
assert.match(source,/purpose,contextId,expiresAt/);
assert.match(source,/UPDATE skp_admin_webauthn_challenges/);
assert.match(source,/consumed_at IS NULL AND expires_at>now\(\)/);
assert.match(source,/purpose=\? AND request_id=\?/);
assert.match(source,/RETURNING challenge_hash/);
assert.match(schema,/purpose TEXT NOT NULL CHECK \(purpose IN \('register', 'authenticate'\)\)/);
assert.match(schema,/consumed_at TIMESTAMPTZ/);
assert.doesNotMatch(source,/adminCookie|issueAdminSession|Set-Cookie/);
console.log('WebAuthn challenge source checks passed. No signature verification or integration tests performed.');
