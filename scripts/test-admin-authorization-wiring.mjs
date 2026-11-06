import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const auth=read('lib/admin-authorization.ts');
assert.match(auth,/adminAuthorized\(request\)/);
assert.match(auth,/skp-session:/);
assert.match(auth,/isPostgres\(\)/);
for(const path of ['app/api/store/route.ts','app/api/reviews/route.ts']){
 const src=read(path);
 assert.match(src,/isAuthorizedAdmin/);
 assert.doesNotMatch(src,/localAdminAccess/);
}
assert.match(read('app/api/store/route.ts'),/b\.action==='login'/);
console.log('Shared admin authorization wiring checks passed.');
