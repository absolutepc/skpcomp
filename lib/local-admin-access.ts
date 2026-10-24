// Temporary passwordless admin access for the local development server only.
// Set this to false to restore the password during local development.
const PASSWORDLESS_LOCAL_ADMIN=true;
export function localAdminAccess(request:Request):boolean{
 if(!PASSWORDLESS_LOCAL_ADMIN||process.env.NODE_ENV!=='development')return false;
 const host=new URL(request.url).hostname;
 return host==='localhost'||host==='127.0.0.1'||host==='[::1]';
}
