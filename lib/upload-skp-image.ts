'use client';
import { upload } from '@vercel/blob/client';

type MediaKind='product'|'slide';
export async function uploadSkpImage(image: Blob, kind: MediaKind, id: string):Promise<string>{
  if(!/^[a-zA-Z0-9_-]{1,90}$/.test(id))throw Error('Некорректный ID изображения');
  const extension=image.type==='image/png'?'png':'webp';
  if(!['image/png','image/webp'].includes(image.type)||image.size>8*1024*1024)
    throw Error('Поддерживаются PNG/WebP до 8 МБ');
  const config=await fetch('/api/media/provider',{cache:'no-store'});
  if(!config.ok)throw Error('Не удалось определить хранилище изображений');
  const result=await config.json() as {provider?:string};
  if(result.provider==='vercel-blob'){
    const path=(kind==='slide'?'slides/':'products/')+id+'/'+crypto.randomUUID()+'.'+extension;
    const uploaded=await upload(path,image,{
      access:'public',
      handleUploadUrl:'/api/media/blob-upload',
      contentType:image.type,
    });
    return uploaded.url;
  }
  if(result.provider!=='cloudflare-r2')throw Error('Хранилище изображений не настроено');
  const data=new FormData();
  data.append(kind==='slide'?'slideId':'productId',id);
  if(kind==='slide')data.append('assetType','slide');
  data.append('file',image,'skp-image.'+extension);
  const response=await fetch('/api/media',{method:'POST',body:data});
  const contentType=response.headers.get('content-type')||'';
  const payload=contentType.includes('application/json')
    ? await response.json() as {url?:string;error?:string}
    : null;
  if(!response.ok||!payload?.url)
    throw Error(payload?.error||'Не удалось загрузить изображение (HTTP '+response.status+').');
  return payload.url;
}
