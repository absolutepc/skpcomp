import {verifyRegistrationResponse} from '@simplewebauthn/server';
import type {RegistrationResponseJSON} from '@simplewebauthn/server';
import {adminWebAuthnConfig} from './admin-passkey-config';
import {consumeWebAuthnChallenge} from './admin-webauthn-challenges';
import {saveVerifiedAdminPasskey} from './admin-passkey-enrollment-store';

/**
 * Must be invoked ONLY from an endpoint that has independently confirmed
 * a recent password reauthentication for the admin, and binds contextId to
 * that session. This function does NOT authenticate its own caller.
 */
export async function verifyAndStoreAdminPasskeyRegistration(input:{
 response:RegistrationResponseJSON;
 challenge:string;
 contextId:string;
 origin:string;
 deviceLabel?:string;
}):Promise<boolean>{
 const {response,challenge,contextId,origin}=input;
 if(!/^[a-f0-9]{64}$/.test(challenge)||!contextId||contextId.length>256||
  !response||typeof response.id!=='string')return false;
 const config=adminWebAuthnConfig(origin);
 const verification=await verifyRegistrationResponse({
  response,
  expectedChallenge:challenge,
  expectedOrigin:config.origin,
  expectedRPID:config.rpID,
  requireUserVerification:true,
 });
 if(!verification.verified||!verification.registrationInfo)return false;
 const consumed=await consumeWebAuthnChallenge(challenge,'register',contextId);
 if(!consumed)return false;
 const {credential}=verification.registrationInfo;
 return saveVerifiedAdminPasskey({
  credentialId:credential.id,
  publicKey:Uint8Array.from(credential.publicKey),
  counter:credential.counter,
  transports:credential.transports||[],
  deviceLabel:input.deviceLabel,
 });
}
