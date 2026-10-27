'use client';
import type {CSSProperties,ReactNode} from 'react';
import {ShoppingBag} from 'lucide-react';
import type {Product,BrandDefinition} from '../lib/seed';
import {fieldsForProduct,specValue} from '../lib/catalog';
import CardActionButtons from './card-action-buttons';
import ProductRatingSummary from './product-rating-summary';
import './catalog-product-card.css';
const accents:Record<string,string>={palit:'#ffe04b',intel:'#16b8ff',asus:'#ff345e',msi:'#ff345e',xpg:'#c645ff',samsung:'#20a9ff',deepcool:'#13e3d4',logitech:'#15ddeb',gigabyte:'#ff9c32',amd:'#ff723a',kingston:'#ff4052','lian li':'#d344ff'};
const preferred:Record<string,string[]>={gpu:['vram','videoMemory','bus','interface'],cpu:['cores','threads','frequency','socket'],motherboard:['socket','memory','wifi','form'],ram:['capacity','speed','latency','memory'],ssd:['capacity','interface','readSpeed','form'],cooler:['radiator','tdp','rgb','coolingType'],mouse:['connection','dpi','weight','sensor'],case:['boardForm','form','rgb','color']};
export default function CatalogProductCard({product:p,brands,visual,nav,favorite,compared,onFavorite,onCompare,onAdd}:{product:Product;brands?:BrandDefinition[];visual:ReactNode;nav:(path:string)=>void;favorite:boolean;compared:boolean;onFavorite:()=>void;onCompare:()=>void;onAdd:()=>void}){
 const brand=brands?.find(b=>b.name.toLowerCase()===p.brand.toLowerCase());
 const fields=fieldsForProduct(p).filter(f=>specValue(p,f).trim());
 const keys=preferred[p.category]||[];
 const selected=[...keys.map(key=>fields.find(f=>f.key===key)).filter((f):f is typeof fields[number]=>!!f),...fields.filter(f=>!keys.includes(f.key)&&!['brand','color','brandSeries'].includes(f.key))].slice(0,4);
 const href='/product/'+p.id;
 const follow=(e:React.MouseEvent<HTMLAnchorElement>)=>{e.preventDefault();nav(href)};
 return <article className="card skp-neon-card" style={{'--brand-accent':accents[p.brand.toLowerCase()]||'#ffe500'} as CSSProperties}>
  {p.brand&&<div className="skp-neon-brand"><div>{brand?.logo?<img src={brand.logo} alt={p.brand}/>:<span>{p.brand}</span>}</div></div>}
  <CardActionButtons action="favorite" name={p.name} favorite={favorite} compared={compared} onFavorite={onFavorite} onCompare={onCompare}/>
  <a className="skp-neon-image" href={href} onClick={follow}>{visual}</a>
  <a className="skp-neon-name" title={p.name} href={href} onClick={follow}><h3>{p.name}</h3></a>
  <div className="skp-neon-specs">{selected.length?selected.map(f=>{const value=specValue(p,f);const unit=f.key==='cores'?'ядер':f.key==='threads'?'потоков':f.unit;const text=value+(unit&&!value.toLowerCase().includes(unit.toLowerCase())?' '+unit:'');return <span key={f.key} title={f.label+': '+text}>{text}</span>}):<span className="skp-neon-excerpt">{p.description||'Характеристики уточняются'}</span>}</div>
  <div className="skp-neon-meta"><span className={'skp-neon-stock'+(p.stock&&p.price>0?' in-stock':'')}>{p.price===0?'Уточните наличие':p.stock?'В наличии':'Под заказ'}</span><ProductRatingSummary productId={p.id} compact onOpen={()=>nav(href)}/></div>
  <div className="skp-neon-purchase"><strong>{p.price>0?new Intl.NumberFormat('ru-RU').format(p.price)+' ₽':'Цена по запросу'}</strong><div className="skp-neon-purchase-buttons"><CardActionButtons action="compare" name={p.name} favorite={favorite} compared={compared} onFavorite={onFavorite} onCompare={onCompare}/><button className="skp-neon-cart" aria-label={'Добавить в корзину: '+p.name} disabled={p.price===0} onClick={onAdd}><ShoppingBag size={19}/></button></div></div>
 </article>;
}
