import {storeEnv,isPostgres} from '../db/platform-store';
import {newQrChallenge,qrChallengeHash} from './admin-qr-challenge';

export type AdminWebAuthnPurpose='register'|'authenticate';
const CHALLENGE_LIFETIME_SECONDS=120;

/**
 * Persists a short-lived, one-use challenge.
 * For registration, contextId must identify an authenticated, recently
 * password-verified admin enrollment flow. For QR authentication it must
 * identify the pending QR request. Callers MUST verify that binding.
 * This module does not verify WebAuthn signatures or grant access.
 */
export async function issueWebAuthnChallenge(purpose:AdminWebAuthnPurpose,contextId:string){
 if(!isPostgres())throw new Error('PostgreSQL required');
 if(!['register','authenticate'].includes(purpose)||!contextId||contextId.length>256)
  throw new Error('Invalid WebAuthn challenge context');
 const challenge=newQrChallenge();
 const challengeHash=await qrChallengeHash(challenge);
 const expiresAt=Math.floor(Date.now()/1000)+CHALLENGE_LIFETIME_SECONDS;
 const {DB}=await storeEnv();
 await DB.prepare(`INSERT INTO skp_admin_webauthn_challenges
 (challenge_hash,purpose,request_id,expires_at)
 VALUES (?,?,?,to_timestamp(?))`)
  .bind(challengeHash,purpose,contextId,expiresAt).run();
 return {challenge,expiresAt};
}

/** Atomic consumption prevents replay, including concurrent submissions.
 * The caller must separately verify the WebAuthn response using an audited
 * library, expected origin/RP ID, user verification, and stored credential.
 */
export async function consumeWebAuthnChallenge(
 challenge:string,purpose:AdminWebAuthnPurpose,contextId:string
):Promise<boolean>{
 if(!isPostgres())throw new Error('PostgreSQL required');
 if(!['register','authenticate'].includes(purpose)||!contextId||contextId.length>256)
  return false;
 const challengeHash=await qrChallengeHash(challenge);
 const {DB}=await storeEnv();
 const row=await DB.prepare(`UPDATE skp_admin_webauthn_challenges
 SET consumed_at=now()
 WHERE challenge_hash=? AND purpose=? AND request_id=?
 AND consumed_at IS NULL AND expires_at>now()
 RETURNING challenge_hash`)
  .bind(challengeHash,purpose,contextId).first<{challenge_hash:string}>();
 return !!row;
}
