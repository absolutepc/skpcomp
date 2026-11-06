export function trustedQrDestination(value:string,origin:string):string|null{
 try{
  const url=new URL(value);
  if(url.origin!==origin||url.pathname!=='/admin/qr/approve'||
   url.searchParams.size!==1||url.searchParams.getAll('request').length!==1||
   !/^[a-f0-9]{64}$/.test(url.searchParams.get('request')||'')||
   url.hash||url.username||url.password)return null;
  // Open the same request in the installed PWA, without broadening accepted QR origins.
  return '/admin-key/approve'+url.search;
 }catch{return null}
}
