import {activeSessionOwnerId} from '../../../../../lib/vercel-admin-session';
import {isPostgres,storeEnv} from '../../../../../db/platform-store';

export const dynamic='force-dynamic';
const headers={
 'Cache-Control':'no-store, private',
 'X-Content-Type-Options':'nosniff',
 'Referrer-Policy':'no-referrer',
 'X-Frame-Options':'DENY',
};

/** Read-only inventory for the authenticated owner.
 * Never expose public keys, session tokens, challenge material or raw credential IDs.
 * A backup is not considered verified merely because it is registered.
 */
export async function GET(request:Request){
 if(!isPostgres())return Response.json({error:'Unavailable'},{status:503,headers});
 try{
  const ownerId=await activeSessionOwnerId(request);
  if(!ownerId)return Response.json({error:'Forbidden'},{status:403,headers});
  const {DB}=await storeEnv();
  const result=await DB.prepare(`SELECT
   md5(credential_id) AS fingerprint,device_label,created_at,last_used_at,
   CASE WHEN revoked_at IS NULL THEN 'active' ELSE 'revoked' END AS status
   FROM skp_admin_passkeys
   WHERE user_id=?::uuid
   ORDER BY created_at DESC`)
   .bind(ownerId).all();
  const verifiedCount=result.results.filter(key=>key.status==='active'&&key.last_used_at!==null).length;
  return Response.json({passkeys:result.results,backupVerified:verifiedCount>=2},{headers});
 }catch{
  return Response.json({error:'Unavailable'},{status:503,headers});
 }
}
