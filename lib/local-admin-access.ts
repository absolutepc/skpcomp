// Temporary passwordless access is limited to LOCAL DEVELOPMENT ONLY.
// Production builds always require the admin password. Do not rely on this
// for a publicly exposed development server or an untrusted Wi-Fi network.
// Set to false to restore password checks even on local development devices.
const PASSWORDLESS_LOCAL_ADMIN=true;

function isLocalNetworkHost(host:string):boolean{
 if(host==='localhost'||host==='127.0.0.1'||host==='[::1]')return true;
 // RFC1918 private IPv4 addresses used by a Mac and phones on the same LAN.
 const octets=host.split('.');
 if(octets.length!==4||octets.some(v=>!/^\d{1,3}$/.test(v)||Number(v)>255))return false;
 const [a,b]=octets.map(Number);
 return a===10||(a===172&&b>=16&&b<=31)||(a===192&&b===168);
}

export function localAdminAccess(request:Request):boolean{
 if(!PASSWORDLESS_LOCAL_ADMIN||process.env.NODE_ENV!=='development')return false;
 return isLocalNetworkHost(new URL(request.url).hostname);
}
