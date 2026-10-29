'use client';
import {useEffect,useRef,useState} from 'react';
import {Check,ChevronRight,Package,Search,X,Wifi,Layers,Fan} from 'lucide-react';
import {categoryIcons} from './catalog-icons';
import {readyCandidateErrors} from '../lib/ready-pc-compatibility';
import type {Product} from '../lib/seed';
import {components} from '../lib/catalog';
import {getProductImages} from '../lib/product-gallery';
import './admin-build-picker.css';

const categories:Record<string,string[]>={
 cpu:['cpu'],motherboard:['motherboard'],gpu:['gpu'],ram:['ram'],
 ssd:['ssd'],storage:['ssd'],psu:['psu'],cooler:['cooler'],case:['case'],
 fans:['fans','cooler'],network:['network'],os:['os']
};
const money=(price:number)=>new Intl.NumberFormat('ru-RU').format(price)+' ₽';
const categoryName=(category:string)=>components[category]||({fans:'Вентиляторы',network:'Сетевое оборудование',os:'Операционные системы'} as Record<string,string>)[category]||'Комплектующие';

export default function AdminBuildPicker({field,products,value,onSelect,onClear,title,buildComponents}:{
 field:string;products:Product[];value:string;onSelect:(product:Product)=>void;
 onClear?:()=>void;title?:string;buildComponents?:Record<string,string>;
}){
 const [open,setOpen]=useState(false);
 const [query,setQuery]=useState('');
 const [category,setCategory]=useState('all');
 const searchRef=useRef<HTMLInputElement>(null);
 // Available and out-of-stock catalog parts can both be used in a ready PC.
 const options=products.filter(product=>product.category!=='pc'&&(
  field==='extra'?product.category in components||['fans','network','os'].includes(product.category):
  (categories[field]||[]).includes(product.category)
 )).sort((a,b)=>a.name.localeCompare(b.name,'ru',{numeric:true}));
 const selected=options.find(product=>product.name===value);
 const categoryOptions=field==='extra'?[...new Set(options.map(product=>product.category))]:[];
 const normalizedQuery=query.trim().toLocaleLowerCase('ru');
 const filtered=options.filter(product=>(category==='all'||product.category===category)&&(!normalizedQuery||
  (product.name+' '+product.brand+' '+categoryName(product.category)).toLocaleLowerCase('ru').includes(normalizedQuery)))
  .map(product=>({product,issues:readyCandidateErrors(field,product,buildComponents,products)}));
 useEffect(()=>{
  if(!open)return;
  searchRef.current?.focus();
  const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false)};
  window.addEventListener('keydown',onKey);
  return()=>window.removeEventListener('keydown',onKey);
 },[open]);
 const thumbnail=(item?:Product)=>{
  const image=item?getProductImages(item)[0]:undefined;
  const fallback=field==='storage'?'ssd':field==='fans'?'cooler':field;
  const Icon=categoryIcons[item?.category||fallback]||(fallback==='network'?Wifi:fallback==='fans'?Fan:fallback==='extra'?Layers:Package);
  return image?<img src={image} alt="" loading="lazy"/>:<Icon size={25} strokeWidth={1.7} aria-hidden="true"/>;
 };
 return <>
  <div className="skp-build-part-picker">
   <button type="button" className={'skp-build-part-trigger'+(value?' is-selected':'')} onClick={()=>{setQuery('');setCategory('all');setOpen(true)}} aria-label={(value?'Заменить: ':'Выбрать: ')+(title||'комплектующую')}>
    <span className="skp-build-part-art">{thumbnail(selected)}</span>
    <span className="skp-build-part-text">
     <strong>{value||'Выбрать из каталога'}</strong>
     <small>{value?(selected?'Выбрано из каталога SKP':'Сохранено ранее · можно заменить'):'Нажмите для выбора модели'}</small>
    </span>
    <ChevronRight size={17} aria-hidden="true"/>
   </button>
   {!!value&&onClear&&<button type="button" className="skp-build-part-clear" onClick={event=>{event.currentTarget.blur();onClear()}} aria-label={'Убрать '+(title||'комплектующую')} title="Убрать из комплектации"><X size={17}/></button>}
  </div>
  {open&&<div className="skp-build-picker-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)setOpen(false)}}>
   <div className="skp-build-picker-dialog" role="dialog" aria-modal="true" aria-label={'Выбор комплектующей: '+(title||'из каталога')}>
    <div className="skp-build-picker-heading">
     <div><small>КАТАЛОГ SKP</small><h3>{title||'Добавить компонент'}</h3><p>Выберите модель. В составе сборки сохранится название товара.</p></div>
     <button type="button" className="skp-build-picker-close" onClick={()=>setOpen(false)} aria-label="Закрыть выбор"><X size={20}/></button>
    </div>
    <div className="skp-build-picker-search"><Search size={18} aria-hidden="true"/><input ref={searchRef} type="search" placeholder="Найти по названию или бренду" aria-label="Поиск комплектующей" value={query} onChange={event=>setQuery(event.target.value)} onKeyDown={event=>{if(event.key==='Enter')event.preventDefault()}}/></div>
    {categoryOptions.length>1&&<div className="skp-build-picker-categories" role="group" aria-label="Категория комплектующих">
     <button type="button" className={category==='all'?'active':''} onClick={()=>setCategory('all')}>Все</button>
     {categoryOptions.map(name=><button key={name} type="button" className={category===name?'active':''} onClick={()=>setCategory(name)}>{categoryName(name)}</button>)}
    </div>}
    <div className="skp-build-picker-count">{filtered.length?('Доступно: '+filtered.filter(item=>!item.issues.length).length+' из '+filtered.length):'Нет подходящих товаров'} · Включая товары под заказ</div>
    <div className="skp-build-picker-options">
     {filtered.slice(0,80).map(({product:part,issues})=><button key={part.id} type="button" disabled={issues.length>0} title={issues.map(issue=>issue.message).join(' ')}
       className={'skp-build-picker-option'+(part.name===value?' active':'')+(issues.length?' incompatible':'')}
       onClick={()=>{if(!issues.length){onSelect(part);setOpen(false)}}}>
      <span className="skp-build-picker-option-art">{thumbnail(part)}</span>
      <span className="skp-build-picker-option-copy">
       <strong>{part.name}</strong>
       <small>{categoryName(part.category)}{part.brand?' · '+part.brand:''}</small>
       {issues.length?<span className="skp-build-picker-conflict">{issues.map(issue=>issue.message).join(' ')}</span>:<span className={part.stock?'stock':'nostock'}>{part.stock?'● В наличии':'○ Под заказ'}</span>}
      </span>
      <span className="skp-build-picker-option-price">{part.price>0?money(part.price):'По запросу'}</span>
      {part.name===value&&<Check size={19} className="skp-build-picker-check" aria-label="Уже выбрано"/>}
     </button>)}
     {filtered.length===0&&<div className="skp-build-picker-empty">В этой категории пока нет подходящих товаров. Добавьте товар в каталог SKP, затем выберите его здесь.</div>}
     {filtered.length>0&&filtered.every(item=>item.issues.length>0)&&<div className="skp-build-picker-empty">Все найденные детали несовместимы с выбранными компонентами. Измените сборку или запрос поиска.</div>}
     {filtered.length>80&&<div className="skp-build-picker-empty">Показаны первые 80 товаров. Уточните запрос для поиска остальных.</div>}
    </div>
   </div>
  </div>}
 </>;
}
