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
 const row=await DB.prepare(`SELECT credential_id,public_key,counter,transports,revoked_at
 FROM skp_admin_passkeys
 WHERE credential_id=? AND revoked_at IS NULL`)
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
 * An atomic comparison prevents stale responses from decreasing the counter.
 * This function is NOT an authenticator verification function.
 */
export async function advanceVerifiedPasskeyCounter(
 credentialId:string,previousCounter:number,nextCounter:number
):Promise<boolean>{
 if(!isPostgres())throw new Error('PostgreSQL required');
 if(!credentialId||credentialId.length>2048||
  !Number.isSafeInteger(previousCounter)||previousCounter<0||
  !Number.isSafeInteger(nextCounter)||nextCounter<previousCounter)return false;
 const {DB}=await storeEnv();
 const updated=await DB.prepare(`UPDATE skp_admin_passkeys
 SET counter=?,last_used_at=now()
 WHERE credential_id=? AND counter=? AND revoked_at IS NULL
 RETURNING credential_id`)
  .bind(nextCounter,credentialId,previousCounter).first<{credential_id:string}>();
 return !!updated;
}
