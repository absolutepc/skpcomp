#!/usr/bin/env node
/**
 * Manual, one-time owner bootstrap. Never run in CI or at application startup.
 * Requires reviewed migrations and explicit operator approval.
 * Does not create a login session or skip WebAuthn verification.
 */
import {createHash,randomBytes} from 'node:crypto';
import {Pool} from 'pg';

if(process.argv.length!==3||process.argv[2]!=='--confirm-owner-bootstrap'||
 process.env.SKP_OWNER_BOOTSTRAP_APPROVED!=='YES'||
 !process.env.DATABASE_URL||!process.env.SKP_OWNER_DISPLAY_NAME?.trim()){
 console.error('Requires --confirm-owner-bootstrap, SKP_OWNER_BOOTSTRAP_APPROVED=YES, DATABASE_URL and SKP_OWNER_DISPLAY_NAME.');
 process.exit(1);
}
const name=process.env.SKP_OWNER_DISPLAY_NAME.trim();
// Never silently create an invitation pointing to a different relying-party origin.
const inviteOrigin=process.env.SKP_OWNER_INVITE_ORIGIN||'https://skpcomp.vercel.app';
if(inviteOrigin!=='https://skpcomp.vercel.app')
 throw new Error('Owner bootstrap only supports the reviewed production WebAuthn origin');
if(name.length>120)throw new Error('Owner display name is too long');
const token=randomBytes(32).toString('hex');
const digest=createHash('sha256').update('skp-employee-invite-v1:').update(token).digest('hex');
const pool=new Pool({connectionString:process.env.DATABASE_URL,max:1});
const client=await pool.connect();
try{
 await client.query('BEGIN');
 // Serialize concurrent bootstraps; never add a second owner or overwrite an existing owner.
 await client.query('SELECT pg_advisory_xact_lock($1)',[763912405]);
 const exists=await client.query("SELECT id FROM skp_admin_users WHERE role='owner' LIMIT 1");
 if(exists.rowCount)throw new Error('Owner already exists. Bootstrap refused.');
 const owner=await client.query(
  "INSERT INTO skp_admin_users(display_name,role,status) VALUES ($1,'owner','active') RETURNING id",[name]);
 const ownerId=owner.rows[0].id;
 await client.query(`INSERT INTO skp_admin_employee_invites(user_id,token_hash,created_by,expires_at)
 VALUES ($1,$2,$1,now()+interval '15 minutes')`,[ownerId,digest]);
 await client.query(`INSERT INTO skp_admin_security_events(actor_user_id,target_user_id,event_type,details)
 VALUES ($1,$1,'user_created','{"method":"manual_owner_bootstrap"}'::jsonb)`,[ownerId]);
 await client.query('COMMIT');
 console.log('Owner created. Open the following one-time link on the owner phone within 15 minutes:');
 console.log(inviteOrigin+'/admin/invite?token='+token);
 console.log('Do not share, log, or store this link. Register the Passkey before enabling the cutover.');
}catch(error){
 await client.query('ROLLBACK');
 console.error(error instanceof Error?error.message:'Owner bootstrap failed');
 process.exitCode=1;
}finally{client.release();await pool.end()}
