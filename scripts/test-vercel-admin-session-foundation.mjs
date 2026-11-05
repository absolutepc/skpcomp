import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const session=read('lib/vercel-admin-session.ts');
assert.match(session,/crypto\.getRandomValues\(new Uint8Array\(32\)\)/);
assert.match(session,/token_hash TEXT PRIMARY KEY/);
assert.match(session,/expires>\?/);
assert.match(session,/DELETE FROM skp_admin_sessions_v2/);
assert.match(session,/adminCookie\(request,token,SESSION_SECONDS\)/);
const endpoints=[
 'app/api/store/route.ts',
 'app/api/orders/route.ts',
 'app/api/reviews/route.ts',
 'app/api/media/blob-upload/route.ts'
];
for(const path of endpoints){
 const source=read(path);
 assert.match(source,/skp_admin|adminAuthorized/,path+' must authenticate admin requests');
}
console.log('Admin session foundation: static checks passed (NOT integration tests)');
