'use client';
import {useState,type ReactNode} from 'react';
import {ChevronRight,Heart,GitCompareArrows,ShoppingBag,Minus,Plus,MapPin,Truck,PackageCheck,CreditCard,Cpu,MemoryStick,Zap,Layers,Monitor} from 'lucide-react';
import type {Product,Store} from '../lib/seed';
import {components,peripherals,fieldsForProduct,specValue,fieldValue} from '../lib/catalog';
import {fromLaptop} from '../lib/fps-estimate';
import {STORE_ADDRESS} from './store-location';
import ProductGallery from './product-gallery';
import ProductReviews from './product-reviews';
import ProductRatingSummary from './product-rating-summary';
import GamingFps from './gaming-fps';
import './product-detail-page.css';
const money=(value:number)=>new Intl.NumberFormat('ru-RU').format(value)+' ₽';
const tabs=[['specs','Характеристики'],['description','Описание'],['reviews','Отзывы']] as const;
type Props={product:Product;data:Store;nav:(path:string)=>void;add:(ids:string[])=>void;fav:(id:string)=>void;compare:(p:Product)=>void;favorites:string[];compared:string[];fallback:ReactNode;card:(p:Product)=>ReactNode};
export default function ProductDetailPage({product:p,data,nav,add,fav,compare,favorites,compared,fallback,card}:Props){
 const [quantity,setQuantity]=useState(1);
 const [tab,setTab]=useState<string>('specs');
 const [allSpecs,setAllSpecs]=useState(false);
 const rows=fieldsForProduct(p).map(field=>({key:field.key,label:field.label+(field.unit?', '+field.unit:''),value:specValue(p,field)})).filter(row=>String(row.value??'').trim());
 const category=components[p.category]||peripherals[p.category]||({laptops:'Ноутбуки',furniture:'Компьютерная мебель',peripherals:'Периферия'} as Record<string,string>)[p.category]||'Каталог';
 const brand=data.brands?.find(b=>b.name.toLowerCase()===p.brand.toLowerCase());
 const variants=p.variantGroup?data.products.filter(v=>v.variantGroup===p.variantGroup):[];
 const related=data.products.filter(v=>v.category===p.category&&v.id!==p.id&&(!p.variantGroup||v.variantGroup!==p.variantGroup)).slice(0,4);
 const go=(path:string)=>(event:React.MouseEvent<HTMLAnchorElement>)=>{event.preventDefault();nav(path)};
 const preferred=p.category==='gpu'?['architecture','vram','videoMemory','interface','watts']:p.category==='cpu'?['cores','threads','socket','frequency','watts']:['capacity','memory','speed','interface','watts'];
 const highlights=[...rows.filter(row=>preferred.includes(row.key)),...rows.filter(row=>!preferred.includes(row.key))].slice(0,5);
 const icons=[Cpu,MemoryStick,Layers,Zap,Monitor];
 const description=()=> <section className="skp-pdp-description-card"><h2>Описание</h2><p>{p.description||'Описание скоро появится.'}</p>{highlights.length>0&&<div className="skp-pdp-highlights">{highlights.map((row,index)=>{const Icon=icons[index];return <div key={row.key}><Icon size={19}/><span><strong>{row.value}</strong><small>{row.label}</small></span></div>})}</div>}</section>;
 return <section className="skp-pdp">
  <nav className="skp-pdp-breadcrumb" aria-label="Хлебные крошки"><a href="/" onClick={go('/')}>Главная</a><ChevronRight size={13}/><a href={'/catalog/'+p.category} onClick={go('/catalog/'+p.category)}>{category}</a>{p.brand&&<><ChevronRight size={13}/><span>{p.brand}</span></>}<ChevronRight size={13}/><span className="skp-pdp-crumb-name">{p.name}</span></nav>
  <div className="skp-pdp-hero">
   <ProductGallery product={p} fallback={fallback} showCounter/>
   <div className="skp-pdp-info"><h1>{p.name}</h1><div className="skp-pdp-meta">{brand?.logo?<img src={brand.logo} alt={p.brand}/>:<strong>{p.brand}</strong>}<ProductRatingSummary productId={p.id} onOpen={()=>{setTab('reviews');document.getElementById('skp-pdp-panel')?.scrollIntoView({behavior:'smooth'})}}/><span className="skp-pdp-code">Код товара: {p.id}</span></div>
    <div className="skp-pdp-badges" aria-hidden="true"/>
    <div className="skp-pdp-variant-slot">
     {variants.length>1&&<div className="skp-pdp-variants" role="group" aria-label="Выбор цвета товара"><div>{variants.map(v=><a key={v.id} href={'/product/'+v.id} onClick={go('/product/'+v.id)} aria-current={v.id===p.id?'page':undefined} title={fieldValue(v,'color')||v.name}><i style={{backgroundColor:v.colorHex||'#aaa'}}/>{fieldValue(v,'color')||v.name}</a>)}</div></div>}
    </div>
    <div className="skp-pdp-price">{p.price>0?money(p.price):'Цена по запросу'}</div>
    <div className="skp-pdp-availability"><span className={p.stock&&p.price>0?'available':''}>● {p.price===0?'Уточните цену и наличие':p.stock?'В наличии':'Под заказ'}</span><a href="/contacts" onClick={go('/contacts')}><MapPin size={13}/>{STORE_ADDRESS}</a></div>
    <div className="skp-pdp-buy">
     {p.price>0&&<div className="skp-pdp-quantity"><button aria-label="Уменьшить количество" disabled={quantity===1} onClick={()=>setQuantity(v=>Math.max(1,v-1))}><Minus size={16}/></button><output aria-live="polite" aria-label="Количество">{quantity}</output><button aria-label="Увеличить количество" disabled={quantity===99} onClick={()=>setQuantity(v=>Math.min(99,v+1))}><Plus size={16}/></button></div>}
     {p.price>0?<button className="skp-pdp-cart" onClick={()=>add(Array(quantity).fill(p.id))}><ShoppingBag size={19}/><span>В корзину</span></button>:data.whatsapp?<a className="skp-pdp-cart" target="_blank" rel="noreferrer" href={'https://wa.me/'+data.whatsapp+'?text='+encodeURIComponent('Здравствуйте! Подскажите цену и наличие: '+p.name)}>Уточнить цену</a>:<span className="skp-pdp-inquiry">Уточните стоимость у магазина</span>}
     <button className="skp-pdp-icon" aria-label={favorites.includes(p.id)?'Убрать из избранного':'В избранное'} aria-pressed={favorites.includes(p.id)} onClick={()=>fav(p.id)}><Heart size={20} fill={favorites.includes(p.id)?'currentColor':'none'}/></button>
     <button className="skp-pdp-icon" aria-label={compared.includes(p.id)?'Убрать из сравнения':'Сравнить'} aria-pressed={compared.includes(p.id)} onClick={()=>compare(p)}><GitCompareArrows size={20}/></button>
    </div>
    {p.category==='laptops'&&<GamingFps product={p} games={data.fpsGames} hardware={fromLaptop(p)} inlineAction/>}
    <div className="skp-pdp-services"><a href="/contacts" onClick={go('/contacts')}><Truck/><span>Доставка<small>Условия у менеджера</small></span></a><a href="/contacts" onClick={go('/contacts')}><PackageCheck/><span>Самовывоз<small>В магазине SKP</small></span></a><a href="/installments" onClick={go('/installments')}><CreditCard/><span>Рассрочка<small>До 12 месяцев, 4%/мес.</small></span></a></div>
   </div>
  </div>
  <div className="skp-pdp-tabs" role="tablist" aria-label="Информация о товаре">{tabs.map(([id,label])=><button key={id} id={'skp-pdp-tab-'+id} role="tab" tabIndex={tab===id?0:-1} onKeyDown={event=>{const index=tabs.findIndex(item=>item[0]===id);const next=event.key==='ArrowRight'?(index+1)%tabs.length:event.key==='ArrowLeft'?(index+tabs.length-1)%tabs.length:event.key==='Home'?0:event.key==='End'?tabs.length-1:-1;if(next>=0){event.preventDefault();setTab(tabs[next][0]);document.getElementById('skp-pdp-tab-'+tabs[next][0])?.focus()}}} aria-selected={tab===id} aria-controls="skp-pdp-panel" onClick={()=>setTab(id)}>{label}</button>)}</div>
  <div id="skp-pdp-panel" role="tabpanel" aria-labelledby={'skp-pdp-tab-'+tab}>
   {tab==='specs'&&<div className="skp-pdp-content"><div className="skp-pdp-specs"><h2>Основные характеристики</h2>{rows.length?<><dl className={allSpecs?'expanded':''}>{rows.map(row=><div key={row.key}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>{rows.length>6&&<button className={"skp-pdp-all-specs"+(rows.length<=16?' skp-pdp-mobile-specs':'')} onClick={()=>setAllSpecs(v=>!v)}>{allSpecs?'Свернуть':'Все характеристики'}<ChevronRight size={15}/></button>}</>:<p className="skp-pdp-muted">Характеристики уточняются.</p>}</div><div className="skp-pdp-side"><div className="skp-pdp-desktop-description">{description()}</div>{related.length>0&&<section className="skp-pdp-related"><h2>Похожие товары</h2><div>{related.map(card)}</div></section>}</div></div>}
   {tab==='description'&&description()}
   {tab==='reviews'&&<ProductReviews productId={p.id}/>}
  </div>
 </section>;
}
