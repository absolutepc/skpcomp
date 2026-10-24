'use client';
import {useState} from 'react';
import {ArrowRight,Check,ChevronRight,Cpu,Gamepad2,GitCompareArrows,Heart,Minus,Plus,Share2,ShieldCheck,ShoppingBag,Truck,PackageCheck} from 'lucide-react';
import type {Product} from '../lib/seed';
import {getBuildRows,getReadyBuildSummary} from '../lib/build-components';
import {getProductImages} from '../lib/product-gallery';
import {categoryIcons} from './catalog-icons';
import GamingFps from './gaming-fps';
import {fromReadyPC} from '../lib/fps-estimate';

type Props={
 product:Product;catalog:Product[];add:(ids:string[])=>void;
 fav:(id:string)=>void;favorites:string[];compare:(product:Product)=>void;compared:string[];
 nav:(path:string)=>void;notify:(message:string)=>void;
};
const money=(value:number)=>new Intl.NumberFormat('ru-RU').format(value)+' ₽';
const preferred=['cpu','gpu','ram','ssd','motherboard','psu','cooler','case'];
export default function ReadyPcMobileDetail({product,catalog,add,fav,favorites,compare,compared,nav,notify}:Props){
 const [quantity,setQuantity]=useState(1);
 const rows=getBuildRows(product);
 const quick=preferred.flatMap(key=>rows.filter(row=>row.key===key)).slice(0,8);
 const specs=quick.length?quick:getReadyBuildSummary(product);
 const related=catalog.filter(item=>item.category==='pc'&&item.id!==product.id).slice(0,8);
 const share=async()=>{
  const url=window.location.href;
  if(navigator.share){try{await navigator.share({title:product.name,url});return}catch{return}}
  try{await navigator.clipboard.writeText(url);notify('Ссылка на ПК скопирована')}
  catch{notify('Не удалось скопировать ссылку')}
 };
 return <div className="skp-ready-mobile-details">
  <div className="skp-ready-mobile-name">
   <h1>{product.name}</h1><span className="skp-ready-mobile-label">Готовый ПК</span>
  </div>
  <p className="skp-ready-mobile-description">{product.description}</p>
  <div className="skp-ready-mobile-quick-specs">
   {specs.map(row=>{const Icon=categoryIcons[row.key]||Cpu;return <div className="skp-ready-mobile-quick-row" key={row.key}>
    <Icon size={16} aria-hidden="true"/><span>{row.label||'Характеристика'}</span><strong>{row.value}</strong>
   </div>})}
  </div>
  <div className="skp-ready-mobile-buy">
   <strong className="skp-ready-mobile-price">{product.price>0?money(product.price):'По запросу'}</strong>
   {product.price>0&&<div className="skp-ready-mobile-quantity" aria-label="Количество">
    <button aria-label="Уменьшить количество" onClick={()=>setQuantity(n=>Math.max(1,n-1))}><Minus size={15}/></button><span>{quantity}</span>
    <button aria-label="Увеличить количество" onClick={()=>setQuantity(n=>Math.min(9,n+1))}><Plus size={15}/></button>
   </div>}
   <button className="skp-ready-mobile-cart" type="button" disabled={product.price<=0} onClick={()=>add(Array(quantity).fill(product.id))}>
    <ShoppingBag size={19}/>В корзину
   </button>
  </div>
  <div className="skp-ready-mobile-actions">
   <button type="button" onClick={()=>fav(product.id)} aria-pressed={favorites.includes(product.id)}><Heart size={19} fill={favorites.includes(product.id)?'currentColor':'none'}/><span>{favorites.includes(product.id)?'В избранном':'В избранное'}</span></button>
   <button type="button" onClick={()=>compare(product)} aria-pressed={compared.includes(product.id)}><GitCompareArrows size={19}/><span>{compared.includes(product.id)?'В сравнении':'Сравнить'}</span></button>
   <GamingFps key={product.id} product={product} hardware={fromReadyPC(product)} inlineAction/>
   <button type="button" onClick={()=>void share()}><Share2 size={19}/><span>Поделиться</span></button>
  </div>
  <div className="skp-ready-mobile-perks">
   <div><ShieldCheck size={22}/><span>Гарантия на ПК</span></div>
   <div><Check size={22}/><span>Проверка сборки</span></div>
   <div><PackageCheck size={22}/><span>Возможность модернизации</span></div>
   <div><Truck size={22}/><span>Доставка</span></div>
  </div>
  {related.length>0&&<section className="skp-ready-mobile-related">
   <div className="skp-ready-mobile-related-title"><h2>Похожие товары</h2><button type="button" onClick={()=>nav('/pc')}>Смотреть все <ArrowRight size={15}/></button></div>
   <div className="skp-ready-mobile-related-scroll">
    {related.map(p=><article key={p.id} className="skp-ready-mobile-related-card">
     <a href={'/product/'+p.id} onClick={e=>{e.preventDefault();nav('/product/'+p.id)}}>{getProductImages(p)[0]&&<img src={getProductImages(p)[0]} alt={p.name} loading="lazy"/>}<strong>{p.name}</strong></a>
     <div><span>{p.price>0?money(p.price):'По запросу'}</span><button disabled={!p.price} type="button" aria-label={'Добавить в корзину: '+p.name} onClick={()=>add([p.id])}><ShoppingBag size={15}/></button></div>
    </article>)}
   </div>
  </section>}
 </div>;
}
