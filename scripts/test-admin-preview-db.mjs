import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

const feature = 'feature/vercel-admin-qr-passkeys';
const staging = 'ep-icy-tree-bak4zf4a.eu-central-1.aws.neon.tech';
const sentinel = 'private-test-marker';
const connection = host => 'postgresql://tester:' + sentinel + '@' + host + '/test';
function check(value, expected, target = 'preview', ref = feature, script = 'scripts/admin-preview-db-guard.mjs') {
  const {status, stdout, stderr} = spawnSync(process.execPath, [script], {
    encoding:'utf8', env:{VERCEL_ENV:target, VERCEL_GIT_COMMIT_REF:ref, DATABASE_URL:value},
  });
  assert.equal(status, expected);
  assert.ok(!(stdout + stderr).includes(sentinel));
  return stdout + stderr;
}

test('accepts direct and pooled staging connections', () => {
  check(connection(staging), 0);
  check(connection(staging.replace('.','-pooler.')) + '?sslmode=require&channel_binding=require', 0);
});
test('blocks production, impostors, absent URLs, and routing overrides', () => {
  for (const value of ['',sentinel,connection(staging.replace('icy-tree-bak4zf4a','silent-cloud-bac1jt6c')),
    connection(staging + '.example.org'),connection('bad.' + staging),
    connection(staging) + '?host=evil',connection(staging) + '?options=endpoint%3Dmain',
    connection(staging).replace('postgresql:', 'https:')]) check(value,1);
});
test('scopes the check to the feature Preview and fails closed for unknown Preview refs', () => {
  check('',0,'production'); check('',0,'development'); check('',0,'preview','another-branch');
  check('',1,'preview','');
});
test('Vercel preflight stops before its other checks and standard build starts with the guard', () => {
  assert.doesNotMatch(check(connection('production.invalid'),1,'preview',feature,'scripts/vercel-preflight.mjs'), /Vercel Vite config/);
  const {scripts} = JSON.parse(readFileSync(new URL('../package.json',import.meta.url)));
  assert.ok(scripts.build.startsWith('node scripts/admin-preview-db-guard.mjs &&'));
  assert.ok(scripts['build:vercel'].startsWith('node scripts/vercel-preflight.mjs &&'));
});
