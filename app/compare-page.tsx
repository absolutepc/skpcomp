'use client';
import {useState} from 'react';
import {X,GitCompareArrows,ArrowLeft} from 'lucide-react';
import type {Product} from '../lib/seed';
import {categoryFields,components,peripherals,fieldValue,normalizeProduct} from '../lib/catalog';
import {getBuildRows} from '../lib/build-components';

export const comparisonCategory=(product:Product)=>normalizeProduct(product).category;
export function comparisonLabel(category:string){return components[category]||peripherals[category]||({pc:'Готовые ПК',laptops:'Ноутбуки',furniture:'Компьютерная мебель'} as Record<string,string>)[category]||category}
const money=(amount:number)=>amount?new Intl.NumberFormat('ru-RU').format(amount)+' ₽':'По запросу';
export default function ComparePage({products,onRemove,onClear,nav}:{products:Product[];onRemove:(id:string)=>void;onClear:()=>void;nav:(path:string)=>void}){
 const [onlyDiff,setOnlyDiff]=useState(false);
 const category=products.length?comparisonCategory(products[0]):'';
 const columns=products.filter(p=>comparisonCategory(p)===category);
 const specEntries=category==='pc'
  ?Array.from(new Map(columns.flatMap(p=>getBuildRows(p)).map(x=>[x.label,x.key])).entries()).map(([label,key])=>({key,label,forProduct:(p:Product)=>getBuildRows(p).find(row=>row.label===label)?.value||'—'}))
  :(categoryFields[category]||[]).map(f=>({key:f.key,label:f.label+(f.unit?' · '+f.unit:''),forProduct:(p:Product)=>fieldValue(p,f.key)||'—'}));
 const entries=[
  {key:'brand',label:'Бренд',forProduct:(p:Product)=>p.brand||'—'},
  {key:'price',label:'Цена',forProduct:(p:Product)=>money(p.price)},
  {key:'stock',label:'Наличие',forProduct:(p:Product)=>p.stock?'В наличии':'Под заказ'},
  ...(category==='pc'?[{key:'summary',label:'Описание сборки',forProduct:(p:Product)=>p.description||'—'}]:[]),
  ...specEntries
 ];
 const rows=entries.filter(row=>!onlyDiff||new Set(columns.map(p=>row.forProduct(p))).size>1);
 return <section className="skp-compare-page">
  <div className="skp-compare-title"><button type="button" className="button outline" onClick={()=>nav(category==='pc'?'/pc':'/catalog/'+(category||'all'))}><ArrowLeft size={16}/> Назад в каталог</button><h1>Сравнение товаров</h1><p>{category?comparisonLabel(category):'Добавьте товары из каталога'}. Можно сравнивать от двух до четырёх товаров одной категории.</p></div>
  {!columns.length?<div className="empty"><GitCompareArrows size={40}/><h2>Список сравнения пуст</h2><button className="button light" onClick={()=>nav('/catalog/all')}>Выбрать товары</button></div>:
  <><div className="skp-compare-controls"><label className="skp-compare-checkbox"><input type="checkbox" checked={onlyDiff} onChange={e=>setOnlyDiff(e.target.checked)}/> Только различия</label><button type="button" onClick={onClear}>Очистить сравнение</button></div>
  <div className="skp-compare-scroll"><table className="skp-compare-table"><thead><tr><th scope="col">Параметр</th>{columns.map(p=><th scope="col" key={p.id}><button className="skp-compare-remove" aria-label={'Убрать '+p.name} onClick={()=>onRemove(p.id)}><X size={16}/></button><a href={'/product/'+p.id} onClick={e=>{e.preventDefault();nav('/product/'+p.id)}}>{p.image&&<img src={p.image} alt="" loading="lazy"/>}<span>{p.name}</span></a></th>)}</tr></thead>
  <tbody>{rows.map(row=><tr key={row.key}><th scope="row">{row.label}</th>{columns.map(p=><td key={p.id}>{row.forProduct(p)}</td>)}</tr>)}</tbody></table></div>
  {columns.length<2&&<p className="skp-compare-hint">Добавьте ещё один товар той же категории для сравнения.</p>}</>}
 </section>;
}
