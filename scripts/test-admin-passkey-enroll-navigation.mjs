import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const shop=readFileSync(new URL('../app/shop.tsx',import.meta.url),'utf8');
assert.ok(shop.startsWith("'use client';"));
assert.ok(shop.includes('href="/admin/passkey/enroll"'));
assert.ok(shop.includes('Привязать iPhone / Passkey'));
assert.ok(shop.indexOf('href="/admin/passkey/enroll"')>shop.indexOf('!auth?<form'));
console.log('Passkey enrollment navigation invariants passed (static only).');
