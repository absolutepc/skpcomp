import {isPostgres,storeEnv} from '../db/platform-store';

/**
 * Call ONLY after a fresh, independently verified admin reauthentication.
 * This persistence helper does not check passwords, WebAuthn assertions,
 * cookies, or authorize its own invocation.
 */
export async function revokeAdminPasskeyAfterReauthentication(
 credentialId:string
):Promise<boolean>{
 if(!isPostgres())throw new Error('PostgreSQL required');
 if(!credentialId||credentialId.length>2048)return false;
 const {DB}=await storeEnv();
 const result=await DB.prepare(`UPDATE skp_admin_passkeys
 SET revoked_at=now()
 WHERE credential_id=? AND revoked_at IS NULL
 RETURNING credential_id`)
  .bind(credentialId).first<{credential_id:string}>();
 return !!result;
}

/** Safe metadata only: never return credential public keys to the UI. */
export async function listActiveAdminPasskeys(){
 if(!isPostgres())throw new Error('PostgreSQL required');
 const {DB}=await storeEnv();
 const result=await DB.prepare(`SELECT credential_id,device_label,created_at,last_used_at
 FROM skp_admin_passkeys WHERE revoked_at IS NULL
 ORDER BY created_at DESC LIMIT 100`).all<{
  credential_id:string;
  device_label:string;
  created_at:string;
  last_used_at:string|null;
 }>();
 return result.results;
}
