'use client';
import {useEffect,useState} from 'react';
import {ChevronLeft,ChevronRight,Expand,X} from 'lucide-react';
import type {Product} from '../lib/seed';
import {getProductImages} from '../lib/product-gallery';

export default function ProductGallery({product,fallback}:{product:Product;fallback:React.ReactNode}){
 const [active,setActive]=useState(0);
 const [zoom,setZoom]=useState(false);
 const images=getProductImages(product);
 const index=Math.min(active,Math.max(0,images.length-1));
 const current=images[index];
 const change=(delta:number)=>setActive(i=>(i+delta+images.length)%images.length);
 useEffect(()=>{
  if(!zoom)return;
  const key=(event:KeyboardEvent)=>{
   if(event.key==='Escape')setZoom(false);
   if(event.key==='ArrowRight'){event.preventDefault();change(1)}
   if(event.key==='ArrowLeft'){event.preventDefault();change(-1)}
  };
  window.addEventListener('keydown',key);
  return()=>window.removeEventListener('keydown',key);
 },[zoom,images.length]);
 return <div className="skp-product-gallery">
  <div className={'skp-gallery-stage detail-art'+(product.variantGroup?' variant-visual':'')}>
   {current?<button type="button" className="skp-gallery-zoom-trigger" onClick={()=>setZoom(true)} title="Открыть фото на весь экран"><img src={current} alt={product.name+' — фото '+(index+1)}/><span><Expand size={17}/> Увеличить</span></button>:fallback}
   {images.length>1&&<div className="skp-gallery-nav">
    <button type="button" aria-label="Предыдущее фото" onClick={()=>change(-1)}><ChevronLeft size={20}/></button>
    <button type="button" aria-label="Следующее фото" onClick={()=>change(1)}><ChevronRight size={20}/></button>
   </div>}
  </div>
  {images.length>1&&<div className="skp-gallery-thumbnails" style={{gridTemplateColumns:`repeat(${Math.ceil(images.length/2)},minmax(0,128px))`}} role="group" aria-label="Фотографии товара">
   {images.map((src,i)=><button type="button" className={index===i?'active':''} key={src} aria-label={'Показать фото '+(i+1)} aria-pressed={index===i} onClick={()=>setActive(i)}><img src={src} alt=""/></button>)}
  </div>}
  {zoom&&current&&<div className="skp-gallery-lightbox" role="dialog" aria-modal="true" aria-label={'Просмотр фотографий: '+product.name} onClick={()=>setZoom(false)}>
    <button className="skp-lightbox-close" aria-label="Закрыть" onClick={()=>setZoom(false)}><X size={25}/></button>
    <div className="skp-gallery-lightbox-image" onClick={event=>event.stopPropagation()}><img src={current} alt={product.name+' — фото '+(index+1)}/></div>
    {images.length>1&&<div className="skp-lightbox-controls" onClick={event=>event.stopPropagation()}>
      <button aria-label="Предыдущее фото" onClick={()=>change(-1)}><ChevronLeft/></button><span>{index+1} из {images.length}</span><button aria-label="Следующее фото" onClick={()=>change(1)}><ChevronRight/></button>
    </div>}
   </div>}
 </div>;
}
