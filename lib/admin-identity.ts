import {isPostgres,storeEnv} from '../db/platform-store';

export type AdminRole='owner'|'admin';
export type ActiveAdminIdentity={id:string;role:AdminRole;displayName:string};

/**
 * A role is never taken from a browser request, QR payload, or session cookie.
 * Look up the account in PostgreSQL on every privileged operation so blocking
 * a user takes effect without waiting for session expiry.
 */
export async function findActiveAdminIdentity(userId:string):Promise<ActiveAdminIdentity|null>{
 if(!isPostgres())return null;
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId))
  return null;
 const {DB}=await storeEnv();
 const row=await DB.prepare(`SELECT id,role,display_name
  FROM skp_admin_users WHERE id=?::uuid AND status='active'
  AND role IN ('owner','admin')`).bind(userId).first<{
  id:string;role:AdminRole;display_name:string
 }>();
 if(!row)return null;
 return {id:row.id,role:row.role,displayName:row.display_name};
}

export async function findActiveIdentityByPasskey(credentialId:string):Promise<ActiveAdminIdentity|null>{
 if(!isPostgres()||!credentialId||credentialId.length>2048)return null;
 const {DB}=await storeEnv();
 const row=await DB.prepare(`SELECT u.id,u.role,u.display_name
  FROM skp_admin_passkeys p JOIN skp_admin_users u ON u.id=p.user_id
  WHERE p.credential_id=? AND p.revoked_at IS NULL
   AND u.status='active' AND u.role IN ('owner','admin')`)
  .bind(credentialId).first<{id:string;role:AdminRole;display_name:string}>();
 if(!row)return null;
 return {id:row.id,role:row.role,displayName:row.display_name};
}
