import {localAdminAccess} from '../../../lib/local-admin-access';
import {productMediaFolder,isProductMediaKey} from '../../../lib/product-media-path';
import {gameProfiles} from '../../../lib/fps-estimate';
import {env} from 'cloudflare:workers';

const E=env as unknown as {MEDIA?:R2Bucket;ADMIN_PASSWORD?:string};
const MEDIA_KEY=/^(?:products|slides|brands)\/[a-zA-Z0-9_-]{1,90}\/[0-9a-f-]{36}\.(?:webp|png)$/;
const FPS_MEDIA_KEY=/^fps-games\/[a-zA-Z0-9_-]{1,90}\/[0-9a-f-]{36}\.(?:webp|png|jpg)$/;
const MAX_FILE_BYTES=8*1024*1024;
const json=(data:object,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function authorized(request:Request){
 if(localAdminAccess(request))return true;
 if(!E.ADMIN_PASSWORD)return false;
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('skp-session:'+E.ADMIN_PASSWORD));
 const token=Array.from(new Uint8Array(bytes)).map(b=>b.toString(16).padStart(2,'0')).join('');
 return (request.headers.get('cookie')||'').split(';').some(c=>c.trim()==='skp_admin='+token);
}
export async function GET(request:Request){
 if(!E.MEDIA)return json({error:'Хранилище R2 не настроено'},503);
 const key=new URL(request.url).searchParams.get('key')||'';
 if(!MEDIA_KEY.test(key)&&!FPS_MEDIA_KEY.test(key)&&!isProductMediaKey(key))return json({error:'Некорректный путь фотографии'},400);
 try{
  const object=await E.MEDIA.get(key);
  if(!object)return json({error:'Фотография не найдена'},404);
  return new Response(object.body,{
   headers:{
    'Content-Type':key.endsWith('.png')?'image/png':key.endsWith('.jpg')?'image/jpeg':'image/webp',
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
  const file=data.get('file'),isSlide=data.get('assetType')==='slide',isBrand=data.get('assetType')==='brand',isFpsGame=data.get('assetType')==='fps-game';
  const assetId=isSlide?data.get('slideId'):isBrand?data.get('brandId'):isFpsGame?data.get('gameId'):data.get('productId');
  if(typeof assetId!=='string'||!/^[a-zA-Z0-9_-]{1,90}$/.test(assetId))return json({error:'Некорректный ID изображения'},400);
  if(isFpsGame&&!gameProfiles.some(game=>game.id===assetId))return json({error:'Неизвестная игра FPS'},400);
  if(!(file instanceof File)||file.size<50||file.size>MAX_FILE_BYTES||!(isFpsGame?['image/png','image/webp','image/jpeg']:['image/png','image/webp']).includes(file.type))
   return json({error:isFpsGame?'Загрузите PNG, JPEG или WebP до 8 МБ.':'Загрузите PNG или WebP с прозрачным фоном размером до 8 МБ.'},400);
  const bytes=new Uint8Array(await file.arrayBuffer());
  // Validate the actual file signature, not just the browser-declared MIME.
  const isWebp=String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&
   String.fromCharCode(...bytes.slice(8,12))==='WEBP';
  const isPng=[137,80,78,71,13,10,26,10].every((value,index)=>bytes[index]===value);
  const isJpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  const mime=isWebp?'image/webp':isPng?'image/png':isFpsGame&&isJpeg?'image/jpeg':'';
  if(!mime||file.type!==mime)
   return json({error:'Повреждённый или неподдерживаемый файл изображения'},400);
  const ext=isPng?'png':isFpsGame&&isJpeg?'jpg':'webp';
  // Product directory is derived server-side from validated product metadata.
  // No client-controlled folder/path is accepted. Legacy uploads without
  // category information continue to use products/{productId}/.
  const asText=(value:FormDataEntryValue|null)=>typeof value==='string'?value.slice(0,200):'';
  const folder=isSlide?'slides':isBrand?'brands':isFpsGame?'fps-games':productMediaFolder({
   category:asText(data.get('productCategory')),
   name:asText(data.get('productName')),
   brand:asText(data.get('productBrand')),
   socket:asText(data.get('productSocket')),
   memory:asText(data.get('productMemory')),
   art:asText(data.get('productArt')),
   specs:{
    socket:asText(data.get('specSocket')),
    memory:asText(data.get('specMemory')),
    gpuChipBrand:asText(data.get('gpuChipBrand')),
    gpu:asText(data.get('gpuModel')),
    coolingType:asText(data.get('coolingType'))
   }
  });
  const key=folder+'/'+assetId+'/'+crypto.randomUUID()+'.'+ext;
  if(!MEDIA_KEY.test(key)&&!FPS_MEDIA_KEY.test(key)&&!isProductMediaKey(key))return json({error:'Недопустимая папка изображения'},400);
  await E.MEDIA.put(key,bytes,{httpMetadata:{contentType:mime},customMetadata:isSlide?{slideId:assetId}:isBrand?{brandId:assetId}:isFpsGame?{gameId:assetId}:{productId:assetId}});
  return json({url:'/api/media?key='+key,key,size:file.size},201);
 }catch{return json({error:'Не удалось сохранить файл в R2. Проверьте настройки хранилища.'},503)}
}
