import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import pg from 'pg';
import {adminMigrations,inspectAdminSchema,columnContract} from './admin-schema-preflight.mjs';
const url=new URL(process.env.TEST_DATABASE_URL||'http://invalid');
assert.ok(['localhost','127.0.0.1'].includes(url.hostname)&&url.pathname==='/skp_admin_test');
const client=new pg.Client({connectionString:url.href});await client.connect();
try{
 assert.equal(columnContract().size,9,'all admin tables must be inspected');
 // Representative existing storefront data; never run outside disposable CI DB.
 await client.query("CREATE TABLE IF NOT EXISTS shop(id TEXT PRIMARY KEY,value TEXT NOT NULL)");
 await client.query("INSERT INTO shop(id,value) VALUES ('migration-preservation-test','{\"original\":true}') ON CONFLICT(id) DO NOTHING");
 const before=(await client.query("SELECT value FROM shop WHERE id='migration-preservation-test'")).rows;
 for(let run=0;run<2;run++)for(const file of adminMigrations)await client.query(readFileSync(new URL('../db/'+file,import.meta.url),'utf8'));
 const result=await inspectAdminSchema(client);
 assert.deepEqual(result.incompatible,[]);assert.deepEqual(result.pending,[]);assert.equal(result.readOnly,true);
 assert.deepEqual((await client.query("SELECT value FROM shop WHERE id='migration-preservation-test'")).rows,before);
 await client.query('ALTER TABLE skp_admin_owner_step_up_grants RENAME COLUMN verified_credential_id TO old_verified_credential_id');
 assert.ok((await inspectAdminSchema(client)).pending.some(x=>x.includes('verified_credential_id')));
 await client.query('ALTER TABLE skp_admin_owner_step_up_grants RENAME COLUMN old_verified_credential_id TO verified_credential_id');
 await client.query('ALTER TABLE skp_admin_passkeys ALTER COLUMN device_label TYPE varchar(100)');
 assert.ok((await inspectAdminSchema(client)).incompatible.some(x=>x.includes('device_label')));
 await client.query('ALTER TABLE skp_admin_passkeys ALTER COLUMN device_label TYPE TEXT');
 console.log('Admin migrations: idempotent application, existing storefront data preservation, readonly schema inspection and drift detection passed.');
}finally{await client.end()}
