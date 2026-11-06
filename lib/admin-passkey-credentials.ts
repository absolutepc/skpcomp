import {isPostgres,storeEnv} from '../db/platform-store';

/**
 * Read-only credential lookup for a future audited WebAuthn verifier.
 * A credential ID is public and never sufficient for authorization.
 * The caller MUST verify the authenticator's signature, origin, RP ID,
 * challenge, user verification, and counter before granting access.
 */
export type StoredAdminPasskey={
 credential_id:string;
 public_key:Uint8Array;
 counter:number;
 transports:string[];
 revoked_at:string|null;
};

export async function findActiveAdminPasskey(credentialId:string):Promise<StoredAdminPasskey|null>{
 if(!isPostgres())throw new Error('PostgreSQL required');
 if(!credentialId||credentialId.length>2048)return null;
 const {DB}=await storeEnv();
 const row=await DB.prepare(`SELECT p.credential_id,p.public_key,p.counter,p.transports,p.revoked_at
 FROM skp_admin_passkeys p
 JOIN skp_admin_users u ON u.id=p.user_id
 WHERE p.credential_id=? AND p.revoked_at IS NULL AND u.status='active'`)
  .bind(credentialId).first<{
   credential_id:string;
   public_key:Uint8Array;
   counter:string|number;
   transports:string[]|string;
   revoked_at:string|null;
  }>();
 if(!row)return null;
 const counter=Number(row.counter);
 if(!Number.isSafeInteger(counter)||counter<0)throw new Error('Invalid credential counter');
 const transports=typeof row.transports==='string'?JSON.parse(row.transports):row.transports;
 if(!Array.isArray(transports)||!transports.every(v=>typeof v==='string'))
  throw new Error('Invalid credential transports');
 return {...row,counter,transports,public_key:new Uint8Array(row.public_key)};
}

/**
 * Counter persistence must occur only after verified authentication.
 * Nonzero counters must increase strictly; zero-to-zero is allowed for
 * authenticators that do not implement counters. An atomic comparison
 * prevents stale responses from decreasing or replaying the counter.
 * This function is NOT an authenticator verification function.
 */
export async function advanceVerifiedPasskeyCounter(
 credentialId:string,previousCounter:number,nextCounter:number
):Promise<boolean>{
 if(!isPostgres())throw new Error('PostgreSQL required');
 if(!credentialId||credentialId.length>2048||
  !Number.isSafeInteger(previousCounter)||previousCounter<0||
  !Number.isSafeInteger(nextCounter)||
  (nextCounter!==0 && nextCounter<=previousCounter)||
  (nextCounter===0 && previousCounter!==0))return false;
 const {DB}=await storeEnv();
 const updated=await DB.prepare(`UPDATE skp_admin_passkeys p
 SET counter=?,last_used_at=now()
 FROM skp_admin_users u
 WHERE p.credential_id=? AND p.counter=? AND p.revoked_at IS NULL
 AND u.id=p.user_id AND u.status='active'
 RETURNING credential_id`)
  .bind(nextCounter,credentialId,previousCounter).first<{credential_id:string}>();
 return !!updated;
}
