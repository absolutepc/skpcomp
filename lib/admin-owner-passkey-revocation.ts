import {adminTransaction,isPostgres,storeEnv} from '../db/platform-store';
import {activeSessionOwnerId} from './vercel-admin-session';
import {consumeSessionOwnerStepUpGrantInTransaction} from './admin-owner-step-up-grants';

/** Staging-only owner credential revocation. The last active credential is never revoked. */
export async function revokeOwnerPasskey(request:Request,credentialId:string):Promise<boolean>{
 if(!isPostgres()||!credentialId||credentialId.length>2048)return false;
 const ownerId=await activeSessionOwnerId(request);
 if(!ownerId)return false;
 try{
  return await adminTransaction(async()=>{
   const {DB}=await storeEnv();
   const owner=await DB.prepare("SELECT id FROM skp_admin_users WHERE id=?::uuid AND role='owner' AND status='active' FOR UPDATE").bind(ownerId).first();
   if(!owner||await activeSessionOwnerId(request)!==ownerId)throw Error('Owner session invalid');
   const active=await DB.prepare("SELECT credential_id FROM skp_admin_passkeys WHERE user_id=?::uuid AND revoked_at IS NULL FOR UPDATE").bind(ownerId).all<{credential_id:string}>();
   const keys=active.results;
   if(keys.length<2||!keys.some(key=>key.credential_id===credentialId))throw Error('Cannot revoke last or unknown credential');
   if(!await consumeSessionOwnerStepUpGrantInTransaction(request,'owner-passkey-revoke'))throw Error('Fresh owner verification required');
   const updated=await DB.prepare("UPDATE skp_admin_passkeys SET revoked_at=now() WHERE credential_id=? AND user_id=?::uuid AND revoked_at IS NULL RETURNING credential_id").bind(credentialId,ownerId).first();
   if(!updated)throw Error('Credential not revoked');
   await DB.prepare("INSERT INTO skp_admin_security_events(actor_user_id,target_user_id,event_type,details) VALUES (?::uuid,?::uuid,'passkey_revoked',jsonb_build_object('credential_fingerprint',left(md5(?),12)))").bind(ownerId,ownerId,credentialId).run();
   return true;
  });
 }catch{return false}
}
