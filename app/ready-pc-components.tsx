'use client';
import {Package} from 'lucide-react';
import type {Product} from '../lib/seed';
import {getBuildRows} from '../lib/build-components';
import {getProductImages} from '../lib/product-gallery';
import {categoryIcons} from './catalog-icons';
import './ready-pc-components.css';

const keyCategories:Record<string,string[]> = {
 cpu:['cpu'],motherboard:['motherboard'],gpu:['gpu'],ram:['ram'],ssd:['ssd'],
 storage:['ssd'],psu:['psu'],cooler:['cooler'],case:['case'],fans:['cooler'],
 network:['motherboard']
};
const normalize=(s:string)=>s.toLowerCase().replace(/[^a-zа-яё0-9]+/gi,' ').trim();
function matchPart(value:string,key:string,catalog:Product[]):Product|undefined{
 const target=normalize(value);
 if(!target)return;
 const categories=keyCategories[key]||[];
 const eligible=catalog.filter(p=>p.category!=='pc'&&p.category!=='laptops'&&p.category!=='laptop');
 const exact=eligible.find(p=>normalize(p.name)===target);
 if(exact)return exact;
 // Only match a catalog product if its full name appears in the specification.
 // Avoid choosing a wrong image from a generic word such as "SSD".
 return eligible.filter(p=>categories.length===0||categories.includes(p.category))
   .filter(p=>normalize(p.name).length>=9&&target.includes(normalize(p.name)))
   .sort((a,b)=>b.name.length-a.name.length)[0];
}
export default function ReadyPcComponents({product,catalog}:{product:Product;catalog:Product[]}){
 if(product.category!=='pc')return null;
 const rows=getBuildRows(product);
 if(!rows.length)return null;
 return <section className="skp-ready-pc-parts" aria-labelledby="skp-ready-pc-parts-title">
  <div className="skp-ready-pc-parts-heading"><span>СОСТАВ СБОРКИ</span><h2 id="skp-ready-pc-parts-title">Комплектация</h2><p>Компоненты, установленные в этом компьютере</p></div>
  <div className="skp-ready-pc-parts-grid">{rows.map(row=>{
   const matched=matchPart(row.value,row.key,catalog);
   const image=matched?getProductImages(matched)[0]:undefined;
   const Icon=categoryIcons[matched?.category||row.key]||Package;
   const details=matched?.description?.trim();
   return <article className="skp-ready-pc-part" key={row.key}>
    <div className="skp-ready-pc-part-visual">{image?<img src={image} alt={matched?.name||row.value} loading="lazy"/>:<Icon size={42} strokeWidth={1.3} aria-hidden="true"/>}</div>
    <div className="skp-ready-pc-part-info"><span className="skp-ready-pc-part-type">{row.label}</span><h3>{row.value}</h3>{details&&<p>{details}</p>}</div>
   </article>;
  })}</div>
 </section>;
}
