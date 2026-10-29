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
 const preferred=['cpu','gpu','motherboard','ram','ssd','psu','cooler','case'];
 const allRows=getBuildRows(product);
 // Show everything entered by the administrator, including additional drives,
 // case fans, networking, OS, and custom extras. Keep the core eight first.
 const rows=[...preferred.flatMap(key=>allRows.filter(row=>row.key===key)),...allRows.filter(row=>!preferred.includes(row.key))];
 return <section className="skp-ready-pc-parts" aria-labelledby="skp-ready-pc-parts-title">
  <div className="skp-ready-pc-parts-heading"><span>КОМПЛЕКТАЦИЯ СБОРКИ</span><h2 id="skp-ready-pc-parts-title">Комплектация</h2><p>Здесь перечислены комплектующие, указанные для этого готового ПК. Нажмите на товар, чтобы открыть его страницу в каталоге.</p></div>
  {!rows.length?<p className="skp-ready-pc-parts-empty">Для этой сборки комплектация пока не указана. Уточните список установленных компонентов у менеджера SKP.</p>:<div className="skp-ready-pc-parts-list">{rows.map((row,index)=>{
   const matched=matchPart(row.value,row.key,catalog);
   const image=matched?getProductImages(matched)[0]:undefined;
   const Icon=categoryIcons[matched?.category||row.key]||Package;
   const details=matched?.description?.trim()||row.value;
   const href=matched?'/product/'+encodeURIComponent(matched.id):undefined;
   return <article className={'skp-ready-pc-part'+(index%2?' is-reverse':'')} key={row.key} data-part={row.key}>
    <div className="skp-ready-pc-part-media">
     {href&&matched?<a className="skp-ready-pc-part-image-link" href={href} aria-label={'Открыть '+matched.name}>{image?<img src={image} alt={matched.name} loading="lazy"/>:<Icon size={90} strokeWidth={1.3} aria-hidden="true"/>}</a>:<Icon size={90} strokeWidth={1.3} aria-hidden="true"/>}
    </div>
    <div className="skp-ready-pc-part-content">
     <div className="skp-ready-pc-part-category"><span className="skp-ready-pc-part-icon"><Icon size={23} strokeWidth={1.6}/></span><span className="skp-ready-pc-part-type">{row.label}</span></div>
     <h3>{href?<a href={href}>{row.value}</a>:row.value}</h3>
     {details&&<p>{details}</p>}
     {href&&<a className="skp-ready-pc-part-more" href={href}>Перейти к товару <span aria-hidden="true">→</span></a>}
    </div>
   </article>;
  })}</div>}
 </section>;
}
