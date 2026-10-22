'use client';
import type {Product} from '../lib/seed';
import {components} from '../lib/catalog';

const categories:Record<string,string[]>={
 cpu:['cpu'],motherboard:['motherboard'],gpu:['gpu'],ram:['ram'],
 ssd:['ssd'],storage:['ssd'],psu:['psu'],cooler:['cooler'],case:['case'],
 fans:['cooler','fans'],network:['network'],os:['os']
};

export default function AdminBuildPicker({field,products,value,onSelect}:{
 field:string;products:Product[];value:string;onSelect:(product:Product)=>void;
}){
 // Stock and retail price do not restrict parts already used in a finished PC.
 const options=products.filter(product=>product.category!=='pc'&&(
  field==='extra'?product.category in components||['fans','network','os'].includes(product.category):
  (categories[field]||[]).includes(product.category)
 )).sort((a,b)=>a.name.localeCompare(b.name,'ru',{numeric:true}));
 const selected=options.find(product=>product.name===value)?.id||'';
 if(!options.length)return null;
 return <select aria-label="Выбрать комплектующую из каталога" value={selected}
  style={{width:'100%',minWidth:0,marginBottom:8}}
  onChange={event=>{const product=options.find(item=>item.id===event.target.value);if(product)onSelect(product)}}>
  <option value="">Выбрать из каталога (или ввести ниже)</option>
  {options.map(product=><option key={product.id} value={product.id}>
   {product.name}{product.stock?'':' — нет в наличии'}
  </option>)}
 </select>;
}
