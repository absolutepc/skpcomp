import {verifyAuthenticationResponse} from '@simplewebauthn/server';
import type {AuthenticationResponseJSON} from '@simplewebauthn/server';
import {adminWebAuthnConfig} from './admin-passkey-config';
import {findActiveAdminPasskey,advanceVerifiedPasskeyCounter} from './admin-passkey-credentials';
import {consumeWebAuthnChallenge} from './admin-webauthn-challenges';

/**
 * Cryptographically verify a WebAuthn assertion and consume its one-time
 * challenge. Caller must independently bind contextId to the currently
 * pending QR request (or a separate authenticated admin session).
 *
 * IMPORTANT: a successful result alone MUST NOT issue an admin session.
 * QR approval still requires an explicit user confirmation.
 */
export async function verifyAdminPasskeyAssertion(input:{
 response:AuthenticationResponseJSON;
 challenge:string;
 contextId:string;
 origin:string;
}):Promise<{credentialId:string}|null>{
 const {response,challenge,contextId,origin}=input;
 if(!/^[a-f0-9]{64}$/.test(challenge)||!contextId||contextId.length>256||
  !response||typeof response.id!=='string')return null;
 const config=adminWebAuthnConfig(origin);
 const stored=await findActiveAdminPasskey(response.id);
 if(!stored)return null;
 const verification=await verifyAuthenticationResponse({
  response,
  expectedChallenge:challenge,
  expectedOrigin:config.origin,
  expectedRPID:config.rpID,
  requireUserVerification:true,
  credential:{
   id:stored.credential_id,
   publicKey:stored.public_key,
   counter:stored.counter,
   transports:stored.transports as ('usb'|'nfc'|'ble'|'internal'|'hybrid')[],
  },
 });
 if(!verification.verified)return null;
 const consumed=await consumeWebAuthnChallenge(challenge,'authenticate',contextId);
 if(!consumed)return null;
 const updated=await advanceVerifiedPasskeyCounter(
  stored.credential_id,stored.counter,verification.authenticationInfo.newCounter
 );
 if(!updated)return null;
 return {credentialId:stored.credential_id};
}
