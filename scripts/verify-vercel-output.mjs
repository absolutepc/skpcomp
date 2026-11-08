import assert from 'node:assert/strict';
import {readFileSync, statSync} from 'node:fs';
import {join} from 'node:path';

const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const config = readJson('vercel.json');
assert.equal(config.framework, null, 'Nitro output requires the Other preset');
assert.equal(config.buildCommand, 'pnpm build:vercel');

const output = '.vercel/output';
assert.equal(readJson(join(output, 'config.json')).version, 3);
const server = join(output, 'functions', '__server.func');
const {handler} = readJson(join(server, '.vc-config.json'));
assert.ok(handler && statSync(join(server, handler)).isFile(), 'Missing Nitro function entrypoint');
for (const asset of ['admin-key.webmanifest', 'admin-key-sw.js']) {
  assert.ok(statSync(join(output, 'static', asset)).isFile(), 'Missing Admin Key asset: ' + asset);
}
console.log('Verified Nitro Build Output API v3, server handler and Admin Key static assets.');
