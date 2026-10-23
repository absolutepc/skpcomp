/** Secure cookies in production; allow plain HTTP only on loopback for local development. */
export function adminCookie(request:Request,value:string,maxAge:number):string{
 const url=new URL(request.url);
 const loopback=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
 const secure=!(url.protocol==='http:'&&loopback);
 return 'skp_admin='+value+'; HttpOnly'+(secure?'; Secure':'')+'; SameSite=Strict; Path=/; Max-Age='+maxAge;
}
