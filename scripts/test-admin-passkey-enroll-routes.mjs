import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const options=readFileSync(new URL('../app/api/admin/passkey/enroll/options/route.ts',import.meta.url),'utf8');
const complete=readFileSync(new URL('../app/api/admin/passkey/enroll/complete/route.ts',import.meta.url),'utf8');
for(const source of [options,complete]){
 assert.ok(source.includes('isTrustedAdminOrigin(request)'));
 assert.ok(source.includes("'Cache-Control':'no-store'"));
 assert.ok(source.includes("request.headers.get('content-type')"));
}
assert.ok(options.includes('beginAdminPasskeyEnrollment(request,password)'));
assert.ok(options.includes("userVerification:'required'"));
assert.ok(complete.includes('isAuthorizedAdmin(request)'));
assert.ok(complete.includes('allowNewAdminQrRequest()'));
assert.ok(complete.includes("'Retry-After':'60'"));
assert.ok(complete.indexOf('allowNewAdminQrRequest()')<complete.indexOf('verifyAndStoreAdminPasskeyRegistration({'));
assert.ok(complete.includes('enrollmentContextFromRequest(request)'));
assert.ok(complete.includes('verifyAndStoreAdminPasskeyRegistration('));
assert.ok(!complete.includes('issueAdminSession('));
console.log('Passkey enrollment API route security invariants passed (static only).');
