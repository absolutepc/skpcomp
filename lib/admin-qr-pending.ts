import {storeEnv,isPostgres} from '../db/platform-store';
import {newQrChallenge,qrChallengeHash,qrExpiry} from './admin-qr-challenge';

/** Creates a pending QR request, not an authenticated session. */
export async function createPendingQr(){
 if(!isPostgres())throw new Error('PostgreSQL required');
 const requestToken=newQrChallenge();
 const desktopSecret=newQrChallenge();
 const requestHash=await qrChallengeHash(requestToken);
 const secretHash=await qrChallengeHash(desktopSecret);
 const expiresAt=qrExpiry();
 const {DB}=await storeEnv();
 await DB.prepare("INSERT INTO skp_admin_qr_requests (request_hash,desktop_secret_hash,expires_at) VALUES (?,?,to_timestamp(?))")
  .bind(requestHash,secretHash,expiresAt).run();
 return {requestToken,desktopSecret,expiresAt};
}
