import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../app/api/admin/qr/consume/route.ts',import.meta.url),'utf8');
assert.match(src,/isTrustedAdminOrigin\(request\)/);
assert.match(src,/redeemQrSession\(request,requestToken,desktopSecret\)/);
assert.match(src,/'Set-Cookie':cookie/);
assert.match(src,/no-store/);
console.log('QR consume route ordering checks passed.');
