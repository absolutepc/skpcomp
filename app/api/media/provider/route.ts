export async function GET(){
 const provider=process.env.SKP_MEDIA_PROVIDER==='vercel-blob'?'vercel-blob':'cloudflare-r2';
 return Response.json({provider},{headers:{'Cache-Control':'no-store'}});
}
