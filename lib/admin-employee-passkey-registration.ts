import {verifyRegistrationResponse} from '@simplewebauthn/server';
import type {RegistrationResponseJSON} from '@simplewebauthn/server';
import {adminWebAuthnConfig} from './admin-passkey-config';
import {consumeWebAuthnChallenge} from './admin-webauthn-challenges';
import {consumeInvitationForVerifiedPasskey} from './admin-employee-passkey-binding';

/** A verified WebAuthn challenge is tied to the invite token digest.
 * No password or pre-existing admin session is needed for onboarding.
 */
export async function completeEmployeePasskeyInvitation(input:{
 inviteToken:string;challenge:string;response:RegistrationResponseJSON;
 origin:string;deviceLabel?:string;
}):Promise<boolean>{
 const {inviteToken,challenge,response,origin}=input;
 if(!/^[a-f0-9]{64}$/.test(inviteToken)||!/^[a-f0-9]{64}$/.test(challenge)||
  !response||typeof response.id!=='string')return false;
 const config=adminWebAuthnConfig(origin);
 const verified=await verifyRegistrationResponse({
  response,
  expectedChallenge:Buffer.from(challenge,'hex').toString('base64url'),
  expectedOrigin:config.origin,expectedRPID:config.rpID,
  requireUserVerification:true,
 });
 if(!verified.verified||!verified.registrationInfo)return false;
 const context='invite:'+inviteToken;
 if(!await consumeWebAuthnChallenge(challenge,'register',context))return false;
 const {credential}=verified.registrationInfo;
 return consumeInvitationForVerifiedPasskey(inviteToken,{
  credentialId:credential.id,
  publicKey:Uint8Array.from(credential.publicKey),
  counter:credential.counter,transports:credential.transports||[],
  deviceLabel:input.deviceLabel,
 });
}
