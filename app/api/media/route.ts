import {env} from 'cloudflare:workers';

const E=env as unknown as {MEDIA?:R2Bucket;ADMIN_PASSWORD?:string};
const MEDIA_KEY=/^products\/[a-zA-Z0-9_-]{1,90}\/[0-9a-f-]{36}\.webp$/;
const MAX_FILE_BYTES=8*1024*1024;
const json=(data:object,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function authorized(request:Request){
 if(!E.ADMIN_PASSWORD)return false;
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('skp-session:'+E.ADMIN_PASSWORD));
 const token=Array.from(new Uint8Array(bytes)).map(b=>b.toString(16).padStart(2,'0')).join('');
 return (request.headers.get('cookie')||'').split(';').some(c=>c.trim()==='skp_admin='+token);
}
export async function GET(request:Request){
 if(!E.MEDIA)return json({error:'Хранилище R2 не настроено'},503);
 const key=new URL(request.url).searchParams.get('key')||'';
 if(!MEDIA_KEY.test(key))return json({error:'Некорректный путь фотографии'},400);
 try{
  const object=await E.MEDIA.get(key);
  if(!object)return json({error:'Фотография не найдена'},404);
  return new Response(object.body,{
   headers:{
    'Content-Type':'image/webp',
    'Cache-Control':'public, max-age=31536000, immutable',
    'X-Content-Type-Options':'nosniff',
    'ETag':object.httpEtag
   }
  });
 }catch{return json({error:'Ошибка чтения изображения из R2'},503)}
}
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Запрос с другого сайта запрещён'},403);
 if(!await authorized(request))return json({error:'Войдите в админ-панель'},401);
 if(!E.MEDIA)return json({error:'Хранилище R2 ещё не подключено. Настройте binding MEDIA.'},503);
 if(!(request.headers.get('content-type')||'').includes('multipart/form-data'))return json({error:'Ожидается загрузка файла'},415);
 const length=Number(request.headers.get('content-length')||'0');
 if(length>MAX_FILE_BYTES+100000)return json({error:'Слишком большой файл. Максимум 8 МБ.'},413);
 try{
  const data=await request.formData();
  const file=data.get('file'),productId=data.get('productId');
  if(typeof productId!=='string'||!/^[a-zA-Z0-9_-]{1,90}$/.test(productId))return json({error:'Некорректный ID товара'},400);
  if(!(file instanceof File)||file.size<50||file.size>MAX_FILE_BYTES||file.type!=='image/webp')
   return json({error:'Загрузите WebP с прозрачным фоном размером до 8 МБ.'},400);
  const bytes=new Uint8Array(await file.arrayBuffer());
  // Validate RIFF/WEBP signature; never trust the extension or browser MIME alone.
  if(String.fromCharCode(...bytes.slice(0,4))!=='RIFF'||String.fromCharCode(...bytes.slice(8,12))!=='WEBP')
   return json({error:'Повреждённый или неподдерживаемый WebP-файл'},400);
  const key='products/'+productId+'/'+crypto.randomUUID()+'.webp';
  await E.MEDIA.put(key,bytes,{httpMetadata:{contentType:'image/webp'},customMetadata:{productId}});
  return json({url:'/api/media?key='+key,key,size:file.size},201);
 }catch{return json({error:'Не удалось сохранить файл в R2. Проверьте настройки хранилища.'},503)}
}
