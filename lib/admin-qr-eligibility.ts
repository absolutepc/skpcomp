import {isPostgres,storeEnv} from '../db/platform-store';
import {qrChallengeHash} from './admin-qr-challenge';

/** The QR URL is a public identifier, not authorization. */
export async function isPendingQrRequest(requestToken:string):Promise<boolean>{
 if(!/^[a-f0-9]{64}$/.test(requestToken)||!isPostgres())return false;
 const {DB}=await storeEnv();
 const row=await DB.prepare(`SELECT request_hash FROM skp_admin_qr_requests
 WHERE request_hash=? AND status='pending' AND expires_at>now()`)
  .bind(await qrChallengeHash(requestToken)).first<{request_hash:string}>();
 return !!row;
}
