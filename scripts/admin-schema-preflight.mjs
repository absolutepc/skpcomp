import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
export const adminMigrations=['admin-passkey-schema.sql','admin-roles-schema.sql','admin-employee-invites-schema.sql','admin-owner-step-up-schema.sql','admin-owner-step-up-proof-schema.sql'];
// Extract only declared column contracts from our reviewed SQL. This checker
// never executes migration SQL, neither in production nor in its CLI entrypoint.
export function columnContract(){
 const result=new Map();
 const types={TEXT:'text',UUID:'uuid',BIGINT:'int8',INTEGER:'int4',TIMESTAMPTZ:'timestamptz',BYTEA:'bytea',JSONB:'jsonb'};
 for(const file of adminMigrations){
  const sql=readFileSync(new URL('../db/'+file,import.meta.url),'utf8');
  for(const match of sql.matchAll(/CREATE TABLE IF NOT EXISTS (skp_admin_\w+)\s*\(([\s\S]*?)\n\);/g)){
   const columns=result.get(match[1])||new Map();
   for(const field of match[2].matchAll(/^\s*(\w+)\s+(TEXT|UUID|BIGINT|INTEGER|TIMESTAMPTZ|BYTEA|JSONB)\b/gm))columns.set(field[1],{type:types[field[2]],additive:false});
   result.set(match[1],columns);
  }
  for(const match of sql.matchAll(/ALTER TABLE (skp_admin_\w+)\s+ADD COLUMN IF NOT EXISTS (\w+) (TEXT|UUID)\b/g))result.get(match[1])?.set(match[2],{type:types[match[3]],additive:true});
 }
 return result;
}
export async function inspectAdminSchema(client){
 await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
 try{
  await client.query("SET LOCAL statement_timeout='10s'");
  const {rows:columns}=await client.query("SELECT table_name,column_name,udt_name,is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name LIKE 'skp_admin_%'");
  const {rows:constraints}=await client.query("SELECT c.relname AS table_name,con.contype,pg_get_constraintdef(con.oid) AS definition FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname LIKE 'skp_admin_%' ORDER BY c.relname,con.contype");
  const {rows:version}=await client.query('SHOW server_version_num');
  const pending=[],incompatible=[];
  for(const [table,expected] of columnContract()){
   const existing=columns.filter(c=>c.table_name===table);
   if(!existing.length){pending.push('create '+table);continue}
   for(const [name,spec] of expected){
    const found=existing.find(c=>c.column_name===name);
    if(!found)(spec.additive?pending:incompatible).push(table+'.'+name+' missing');
    else if(found.udt_name!==spec.type)incompatible.push(table+'.'+name+' type '+found.udt_name+' != '+spec.type);
   }
   if(!constraints.some(c=>c.table_name===table&&c.contype==='p'))incompatible.push(table+' missing primary key');
  }
  await client.query('COMMIT');
  return {readOnly:true,serverVersion:Number(version[0].server_version_num),pending,incompatible,constraints,
   conclusion:incompatible.length?'blocked-schema-drift':pending.length?'migration-review-required':'column-contract-matches-review-constraints',
   note:'No migration was executed. Review constraints/indexes, ownership, permissions, extension availability and backups before approval; column compatibility alone is not release approval.'};
 }catch(error){await client.query('ROLLBACK');throw error}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const connectionString=process.env.SKP_SCHEMA_DATABASE_URL;
 if(!connectionString){console.error('Set SKP_SCHEMA_DATABASE_URL through a secure environment using a read-only database role. No connection attempted.');process.exitCode=2}
 else{
  const {Client}=await import('pg');
  const client=new Client({connectionString,connectionTimeoutMillis:5000,application_name:'skp-admin-schema-readonly'});
  try{await client.connect();const report=await inspectAdminSchema(client);console.log(JSON.stringify(report,null,2));if(report.incompatible.length)process.exitCode=1}
  catch(error){console.error('Read-only schema inspection failed; code:',error.code||'unknown');process.exitCode=1}
  finally{await client.end()}
 }
}
