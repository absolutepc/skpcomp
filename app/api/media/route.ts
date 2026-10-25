/**
 * Media compatibility endpoint.
 *
 * Cloudflare development retains the original R2 implementation.
 * Vercel uploads use /api/media/blob-upload via browser upload, never this
 * request-body endpoint. Existing R2 URLs require an explicit media migration.
 */
const useBlob = () => process.env.SKP_MEDIA_PROVIDER === 'vercel-blob';
const unavailable = () => Response.json(
  {error:'Ранее загруженные изображения требуют переноса из R2 в Blob.'},
  {status:503,headers:{'Cache-Control':'no-store'}}
);
export async function GET(request:Request){
 if(useBlob())return unavailable();
 const {GET}=await import('./cloudflare-handler');
 return GET(request);
}
export async function POST(request:Request){
 if(useBlob())return Response.json(
  {error:'На Vercel используйте прямую загрузку через /api/media/blob-upload'},
  {status:405,headers:{'Cache-Control':'no-store'}}
 );
 const {POST}=await import('./cloudflare-handler');
 return POST(request);
}
