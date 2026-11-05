import {ADMIN_RP_ORIGIN} from './admin-passkey-config';

/**
 * QR payload is a request identifier, never an admin session.
 * A separate desktop-only secret must NEVER appear in this URL.
 */
export function adminQrApprovalUrl(requestToken:string):string{
 if(!/^[0-9a-f]{64}$/.test(requestToken))throw new Error('Invalid QR request token');
 const url=new URL('/admin/qr/approve',ADMIN_RP_ORIGIN);
 url.searchParams.set('request',requestToken);
 return url.toString();
}

/** Only accept approval links pointing at the fixed production origin. */
export function parseAdminQrApprovalUrl(input:string):string{
 const url=new URL(input);
 if(url.origin!==ADMIN_RP_ORIGIN||url.pathname!=='/admin/qr/approve'
    ||url.username||url.password||url.hash
    ||url.searchParams.size!==1||url.searchParams.getAll('request').length!==1)throw new Error('Untrusted QR approval URL');
 const requestToken=url.searchParams.get('request')||'';
 if(!/^[0-9a-f]{64}$/.test(requestToken))throw new Error('Invalid QR request token');
 return requestToken;
}
