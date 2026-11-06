import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const auth=read('lib/admin-authorization.ts');
assert.match(auth,/adminAuthorized\(request\)/);
assert.match(auth,/skp-session:/);
assert.match(auth,/isPostgres\(\)/);
for(const path of ['app/api/store/route.ts','app/api/reviews/route.ts','app/api/orders/route.ts','app/api/media/blob-upload/route.ts']){
 const src=read(path);
 assert.match(src,/isAuthorizedAdmin/);
 assert.doesNotMatch(src,/localAdminAccess/);
}
const store=read('app/api/store/route.ts');
assert.match(store,/b\.action==='login'/);
assert.match(store,/b\.action==='logout'/);
assert.match(store,/await revokeAdminSession\(r\)/);
assert.match(store,/if\(isPostgres\(\)\)/);
assert.match(store,/Не удалось завершить сессию/);
assert.match(store,/adminCookie\(r,'',0\)/);
const sessions=read('lib/vercel-admin-session.ts');
assert.match(sessions,/DELETE FROM skp_admin_sessions_v2 WHERE token_hash=\?/);
assert.match(sessions,/return adminCookie\(request,'',0\)/);
console.log('Shared admin authorization wiring checks passed.');
