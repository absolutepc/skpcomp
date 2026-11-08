#!/usr/bin/env node
/** Read-only check of the isolated SKP staging owner and Passkey bindings.
 * Never prints credentials, database URLs, user names, or user IDs.
 */
import {Pool} from 'pg';
const expected='https://skpcomp-git-feature-vercel-ad-ab9e42-udakaev2016-4398s-projects.vercel.app';
if(process.argv.length!==3||process.argv[2]!=='--confirm-staging-readonly'||
 process.env.SKP_ADMIN_OWNER_BACKUP_ENROLLMENT!=='staging'||
 process.env.SKP_ADMIN_STAGING_DB_ISOLATED!=='confirmed'||
 process.env.SKP_ADMIN_STAGING_ORIGIN!==expected||
 process.env.SKP_DATABASE_PROVIDER!=='postgres'||
 !process.env.DATABASE_URL){
 console.error('Refused: isolated staging environment and explicit read-only confirmation required.');
 process.exit(1);
}
const pool=new Pool({connectionString:process.env.DATABASE_URL,max:1});
try{
 const result=await pool.query(`SELECT
 (SELECT count(*)::int FROM skp_admin_users WHERE role='owner' AND status='active') AS active_owners,
 (SELECT count(*)::int FROM skp_admin_users WHERE role='owner') AS all_owners,
 (SELECT count(*)::int FROM skp_admin_passkeys WHERE revoked_at IS NULL AND user_id IS NULL) AS unbound_passkeys,
 (SELECT count(*)::int FROM skp_admin_passkeys p JOIN skp_admin_users u ON u.id=p.user_id WHERE p.revoked_at IS NULL AND u.status='active') AS bound_passkeys`);
 const r=result.rows[0];
 console.log(JSON.stringify({activeOwners:r.active_owners,allOwners:r.all_owners,unboundPasskeys:r.unbound_passkeys,boundPasskeys:r.bound_passkeys},null,2));
 if(r.all_owners>1)process.exitCode=2;
}catch(e){
 console.error('Read-only diagnostic failed:',e?.code||'unavailable');
 process.exitCode=1;
}finally{await pool.end()}
