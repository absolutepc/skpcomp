import {createHash} from 'node:crypto';
import {storeEnv,isPostgres} from '../db/platform-store';
import {verifyRecentAdminPassword} from './admin-passkey-reauth';
import {issueWebAuthnChallenge} from './admin-webauthn-challenges';

const COOKIE_PATTERN=/(?:^|;\s*)skp_admin=([a-f0-9]{64})(?:;|$)/;

/**
 * Derive a non-reversible, server-secret-keyed enrollment context from the
 * exact browser admin session. This prevents a challenge issued to one
 * browser from being completed using a different browser's session.
 * Never return the context identifier to the client.
 */
export async function enrollmentContextFromRequest(request:Request):Promise<string|null>{
 if(!isPostgres())return null;
 const cookie=request.headers.get('cookie')||'';
 const token=COOKIE_PATTERN.exec(cookie)?.[1];
 if(!token)return null;
 const {ADMIN_PASSWORD}=await storeEnv();
 if(!ADMIN_PASSWORD)return null;
 return createHash('sha256').update('skp-passkey-enroll-v1:').update(ADMIN_PASSWORD).update(':').update(token).digest('hex');
}

/** Issues a short-lived one-use challenge only after password reauthentication. */
export async function beginAdminPasskeyEnrollment(request:Request,password:unknown){
 const contextId=await enrollmentContextFromRequest(request);
 if(!contextId)return null;
 if(!await verifyRecentAdminPassword(request,password))return null;
 const {challenge,expiresAt}=await issueWebAuthnChallenge('register',contextId);
 return {challenge,expiresAt};
}
