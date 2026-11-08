import {isPostgres,storeEnv} from '../db/platform-store';

/** Global, database-backed safety cap. Atomic across serverless instances.
 * A shared cap avoids trusting client-controlled IP forwarding headers.
 * Cleanup old buckets periodically as part of DB maintenance.
 */
export async function allowNewAdminQrRequest():Promise<boolean>{
 if(!isPostgres())throw new Error('PostgreSQL required');
 const bucket=Math.floor(Date.now()/60000);
 const {DB}=await storeEnv();
 const row=await DB.prepare(`INSERT INTO skp_admin_qr_rate_limits(bucket,requests)
 VALUES (?,1)
 ON CONFLICT (bucket) DO UPDATE SET requests=skp_admin_qr_rate_limits.requests+1
 WHERE skp_admin_qr_rate_limits.requests < 120
 RETURNING requests`).bind(bucket).first<{requests:number}>();
 return !!row;
}
