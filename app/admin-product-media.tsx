'use client';
import {useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Camera,Check,ImagePlus,LoaderCircle,Star,Trash2} from 'lucide-react';
import type {Product} from '../lib/seed';
import {getProductImages,MAX_GALLERY_IMAGES,updateProductGallery} from '../lib/product-gallery';

type Props={
 product:Product;
 change:(update:(previous:Product)=>Product)=>void;
};
async function transparentWebp(file:File):Promise<Blob>{
 if(!['image/png','image/webp'].includes(file.type))throw Error('Только PNG или WebP с прозрачным фоном');
 if(file.size>20*1024*1024)throw Error('Исходный файл не должен превышать 20 МБ');
 const bitmap=await createImageBitmap(file);
 try{
  const factor=Math.min(1,1800/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(bitmap.width*factor));
  canvas.height=Math.max(1,Math.round(bitmap.height*factor));
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  if(!ctx)throw Error('Не удалось обработать изображение');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  // Require actual transparent pixels instead of merely trusting the PNG/WebP extension.
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
  let hasAlpha=false;
  for(let i=3;i<pixels.length;i+=4*8){if(pixels[i]<245){hasAlpha=true;break}}
  if(!hasAlpha)throw Error('У изображения непрозрачный фон. Удали фон перед загрузкой.');
  const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/webp',.90));
  if(!blob||blob.type!=='image/webp')throw Error('Браузер не смог преобразовать фото в WebP');
  if(blob.size>8*1024*1024)throw Error('Обработанный файл больше 8 МБ');
  return blob;
 }finally{bitmap.close()}
}
export default function AdminProductMedia({product,change}:Props){
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');
 const picker=useRef<HTMLInputElement|null>(null);
 const images=getProductImages(product);
 const update=(apply:(current:string[])=>string[])=>change(prev=>updateProductGallery(prev,apply(getProductImages(prev))));
 async function upload(files:FileList|null){
  if(!files?.length||busy)return;
  setBusy(true);setError('');setMessage('');
  let uploaded=0;
  try{
   for(const file of Array.from(files)){
    if(images.length+uploaded>=MAX_GALLERY_IMAGES)throw Error('Не более '+MAX_GALLERY_IMAGES+' фотографий для одного товара');
    const webp=await transparentWebp(file);
    const data=new FormData();data.append('productId',product.id);data.append('file',webp,file.name.replace(/\.[^.]+$/,'')+'.webp');
    const response=await fetch('/api/media',{method:'POST',body:data});
    const result=await response.json() as {url?:string;error?:string};
    if(!response.ok||!result.url)throw Error(result.error||'Ошибка загрузки изображения');
    update(all=>[...all,result.url!]);
    uploaded++;
   }
   if(uploaded)setMessage('Добавлено фотографий: '+uploaded+'. Нажми «Сохранить товар», чтобы сохранить галерею.');
  }catch(cause){setError(cause instanceof Error?cause.message:'Ошибка загрузки')}
  finally{setBusy(false);if(picker.current)picker.current.value=''}
 }
 return <section className="skp-admin-media">
  <div className="skp-admin-media-heading"><div><h3>Галерея товара</h3><p>Для каждого цвета своя галерея. Первая фотография показывается в каталоге. Принимаются PNG/WebP с прозрачным фоном; файлы преобразуются в WebP.</p></div><span>{images.length} / {MAX_GALLERY_IMAGES}</span></div>
  <input ref={picker} className="skp-media-file-input" type="file" accept="image/png,image/webp" multiple onChange={event=>void upload(event.target.files)} disabled={busy||images.length>=MAX_GALLERY_IMAGES} aria-label="Выбрать фотографии товара"/>
  <button type="button" className="skp-media-upload" disabled={busy||images.length>=MAX_GALLERY_IMAGES} onClick={()=>picker.current?.click()}>
   {busy?<LoaderCircle className="skp-media-spinner" size={20}/>:<ImagePlus size={20}/>}
   {busy?'Загрузка в хранилище…':'Загрузить фотографии'} <span>PNG / WebP · прозрачный фон</span>
  </button>
  {images.length>0&&<div className="skp-admin-media-grid">{images.map((url,i)=><div className="skp-admin-media-item" key={url}>
    <div className="skp-admin-media-preview"><img src={url} alt={'Фотография '+(i+1)}/>{i===0&&<span><Star size={12} fill="currentColor"/> Обложка</span>}</div>
    <div className="skp-admin-media-actions">
      {i!==0&&<button type="button" aria-label="Сделать обложкой" title="Сделать обложкой" onClick={()=>update(all=>[all[i],...all.filter((_,index)=>index!==i)])}><Star size={16}/></button>}
      <button type="button" aria-label="Сдвинуть фото влево" title="Сдвинуть влево" disabled={i===0} onClick={()=>update(all=>{const a=[...all];[a[i-1],a[i]]=[a[i],a[i-1]];return a})}><ArrowLeft size={15}/></button>
      <button type="button" aria-label="Сдвинуть фото вправо" title="Сдвинуть вправо" disabled={i===images.length-1} onClick={()=>update(all=>{const a=[...all];[a[i],a[i+1]]=[a[i+1],a[i]];return a})}><ArrowRight size={15}/></button>
      <button type="button" aria-label="Убрать фото из галереи" title="Убрать из галереи" onClick={()=>update(all=>all.filter((_,index)=>index!==i))}><Trash2 size={16}/></button>
    </div>
   </div>)}</div>}
  {error&&<p className="skp-media-error" role="alert">{error}</p>}
  {message&&<p className="skp-media-success" role="status"><Check size={15}/>{message}</p>}
  <p className="skp-admin-media-footnote">Загрузка файлов происходит сразу в R2. Изменение обложки, порядка и удаление из галереи вступят в силу после сохранения товара. Удаление из галереи не стирает архивный файл из R2.</p>
 </section>;
}
