import {adminWebAuthnConfig} from './admin-passkey-config';

/**
 * QR payload is a request identifier, never an admin session.
 * A separate desktop-only secret must NEVER appear in this URL.
 */
export function adminQrApprovalUrl(requestToken:string,origin:string):string{
 if(!/^[0-9a-f]{64}$/.test(requestToken))throw new Error('Invalid QR request token');
 const trusted=adminWebAuthnConfig(origin).origin;
 const url=new URL('/admin/qr/approve',trusted);
 url.searchParams.set('request',requestToken);
 return url.toString();
}

/** Only accept approval links pointing at the explicitly trusted origin. */
export function parseAdminQrApprovalUrl(input:string,origin:string):string{
 const trusted=adminWebAuthnConfig(origin).origin;
 const url=new URL(input);
 if(url.origin!==trusted||url.pathname!=='/admin/qr/approve'
    ||url.username||url.password||url.hash
    ||url.searchParams.size!==1||url.searchParams.getAll('request').length!==1)throw new Error('Untrusted QR approval URL');
 const requestToken=url.searchParams.get('request')||'';
 if(!/^[0-9a-f]{64}$/.test(requestToken))throw new Error('Invalid QR request token');
 return requestToken;
}
