import {ADMIN_QR_TTL_SECONDS} from './admin-passkey-config';

/** A QR challenge identifies a pending request; it is NEVER an admin credential. */
export function newQrChallenge(){
  const bytes=crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
}
export async function qrChallengeHash(challenge:string){
  if(!/^[0-9a-f]{64}$/.test(challenge))throw new Error('Invalid QR challenge');
  const data=new TextEncoder().encode('skp-admin-qr-v1:'+challenge);
  const hash=new Uint8Array(await crypto.subtle.digest('SHA-256',data));
  return Array.from(hash,b=>b.toString(16).padStart(2,'0')).join('');
}
export function qrExpiry(nowSeconds=Math.floor(Date.now()/1000)){
  return nowSeconds+ADMIN_QR_TTL_SECONDS;
}
