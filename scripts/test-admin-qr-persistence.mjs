import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const pending=read('lib/admin-qr-pending.ts');
const status=read('lib/admin-qr-status.ts');
const consume=read('lib/admin-qr-consume.ts');
for(const [name,source] of [['pending',pending],['status',status],['consume',consume]]){
 assert.match(source,/isPostgres\(\)/,name+' must require PostgreSQL');
 assert.match(source,/qrChallengeHash\(/,name+' must hash request tokens');
 assert.doesNotMatch(source,/adminCookie|issueAdminSession|Set-Cookie/,name+' must not issue sessions');
}
assert.match(pending,/newQrChallenge\(\)/);
assert.match(pending,/desktopSecret=newQrChallenge\(\)/);
assert.match(pending,/expiresAt=qrExpiry\(\)/);
assert.match(status,/desktop_secret_hash=\?/);
assert.match(status,/expires_at>now\(\)/);
assert.match(consume,/status='approved' AND expires_at>now\(\)/);
assert.match(consume,/status='consumed',consumed_at=now\(\)/);
assert.match(consume,/revoked_at IS NULL/);
assert.match(consume,/RETURNING request_hash/);
console.log('QR persistence static checks passed. No database race/integration test performed.');
