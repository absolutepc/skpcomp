import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const auth=read('lib/admin-authorization.ts');
const sessions=read('lib/vercel-admin-session.ts');
const store=read('app/api/store/route.ts');
assert.match(auth,/process\.env\.SKP_ADMIN_REQUIRE_PASSKEY==='true'/);
assert.match(auth,/if\(!isPostgres\(\)\)return false/);
assert.match(auth,/try\{return await adminAuthorized\(request\)\}catch\{return false\}/);
assert.match(sessions,/process\.env\.SKP_ADMIN_REQUIRE_PASSKEY!=='true'&&localAdminAccess\(request\)/);
assert.match(sessions,/JOIN skp_admin_users u ON u.id=s.user_id/);
assert.match(sessions,/u.status='active'/);
assert.match(store,/if\(process\.env\.SKP_ADMIN_REQUIRE_PASSKEY==='true'\)return Response.json/);
assert.match(store,/Вход по паролю отключён/);
console.log('Passkey-only cutover gate checks passed.');

for(const file of ['app/api/media/cloudflare-handler.ts','lib/admin-passkey-reauth.ts'])assert.match(read(file),/if\(process\.env\.SKP_ADMIN_REQUIRE_PASSKEY==='true'\)return false/);
