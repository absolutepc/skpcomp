import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync(new URL('../db/admin-passkey-schema.sql',import.meta.url),'utf8');
const tables=['skp_admin_sessions_v2','skp_admin_passkeys','skp_admin_webauthn_challenges','skp_admin_qr_requests'];
for(const table of tables){
 assert.match(sql,new RegExp('CREATE TABLE IF NOT EXISTS '+table+'\\s*\\(','i'),table+' table missing');
}
assert.match(sql,/credential_id TEXT PRIMARY KEY/);
assert.match(sql,/public_key BYTEA NOT NULL/);
assert.match(sql,/revoked_at TIMESTAMPTZ/);
assert.match(sql,/desktop_secret_hash TEXT NOT NULL/);
assert.match(sql,/expires_at TIMESTAMPTZ NOT NULL/);
assert.match(sql,/status IN \('pending','approved','consumed','expired','denied'\)/);
assert.match(sql,/CHECK \(expires_at > created_at\)/);
assert.doesNotMatch(sql,/DROP TABLE|TRUNCATE|DELETE FROM shop|ALTER TABLE shop/i);
console.log('Admin QR schema static checks passed. Database migration and live auth NOT tested.');
