import {isPostgres,storeEnv} from '../db/platform-store';

export type VerifiedPasskeyRegistration={
 credentialId:string;
 publicKey:Uint8Array;
 counter:number;
 transports:string[];
 deviceLabel?:string;
 ownerId:string;
};

/**
 * Persist ONLY a credential already verified by an audited WebAuthn library
 * after recent admin password reauthentication. This is not an enrollment
 * endpoint and must never be called with unverified browser-supplied keys.
 * Existing or revoked credential IDs are never silently overwritten.
 */
export async function saveVerifiedAdminPasskey(
 verified:VerifiedPasskeyRegistration
):Promise<boolean>{
 if(!isPostgres())throw new Error('PostgreSQL required');
 const {credentialId,publicKey,counter,transports,ownerId}=verified;
 if(!/^[0-9a-f-]{36}$/i.test(ownerId))return false;
 if(!credentialId||credentialId.length>2048||
  !(publicKey instanceof Uint8Array)||publicKey.length<16||publicKey.length>4096||
  !Number.isSafeInteger(counter)||counter<0||
  !Array.isArray(transports)||transports.length>8||
  !transports.every(v=>typeof v==='string'&&v.length<=64))return false;
 const label=(verified.deviceLabel||'').trim().slice(0,100);
 const {DB}=await storeEnv();
 const row=await DB.prepare(`INSERT INTO skp_admin_passkeys
 (credential_id,public_key,counter,transports,device_label,user_id)
 SELECT ?,?,?,?::jsonb,?,id FROM skp_admin_users
 WHERE id=?::uuid AND role='owner' AND status='active'
 ON CONFLICT (credential_id) DO NOTHING
 RETURNING credential_id`)
  .bind(credentialId,publicKey,counter,JSON.stringify(transports),label,ownerId)
  .first<{credential_id:string}>();
 return !!row;
}
