'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight,PackageSearch,Search,X} from 'lucide-react';
import type {Product} from '../lib/seed';
import {getProductImages} from '../lib/product-gallery';
import './store-search.css';

const labels:Record<string,string>={
 pc:'Готовые ПК',cpu:'Процессоры',gpu:'Видеокарты',motherboard:'Материнские платы',
 ram:'Оперативная память',ssd:'Накопители',psu:'Блоки питания',case:'Корпуса',
 cooler:'Охлаждение',monitor:'Мониторы',mouse:'Мыши',keyboard:'Клавиатуры',
 headphones:'Наушники',laptops:'Ноутбуки',furniture:'Компьютерная мебель',
 peripherals:'Периферия'
};
const money=(price:number)=>new Intl.NumberFormat('ru-RU').format(price)+' ₽';

export default function StoreSearch({products,onNavigate,onClose}:{
 products:Product[];
 onNavigate:(path:string)=>void;
 onClose:()=>void;
}){
 const [value,setValue]=useState('');
 const input=useRef<HTMLInputElement>(null);
 useEffect(()=>{
  const previousOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const onEscape=(event:KeyboardEvent)=>{if(event.key==='Escape')onClose()};
  document.addEventListener('keydown',onEscape);
  // Safari can require a second tap to raise the keyboard; the field stays visible.
  input.current?.focus({preventScroll:true});
  return()=>{
   document.body.style.overflow=previousOverflow;
   document.removeEventListener('keydown',onEscape);
  };
 },[onClose]);
 const phrase=value.trim().toLocaleLowerCase('ru-RU');
 const terms=phrase.split(/\s+/).filter(Boolean);
 const matches=(phrase?
  products.filter(product=>{
   const content=[product.name,product.brand,product.description,labels[product.category]||product.category]
    .join(' ').toLocaleLowerCase('ru-RU');
   return terms.every(term=>content.includes(term));
  })
  :products.filter(product=>product.price>0).slice(0,8)
 ).sort((a,b)=>{
  if(!phrase)return 0;
  const rank=(p:Product)=>{
   const name=p.name.toLocaleLowerCase('ru-RU');
   return name.startsWith(phrase)?0:name.includes(phrase)?1:2;
  };
  return rank(a)-rank(b);
 });
 const visible=matches.slice(0,10);
 const select=(product:Product)=>{onClose();onNavigate('/product/'+product.id)};
 return <div className="skp-global-search-overlay" onPointerDown={event=>{
   if(event.target===event.currentTarget)onClose();
  }}>
  <section className="skp-global-search-dialog" role="dialog" aria-modal="true" aria-labelledby="skp-global-search-title">
   <div className="skp-global-search-heading">
    <div><span className="skp-global-search-kicker">КАТАЛОГ SKP</span>
     <h2 id="skp-global-search-title">Поиск товаров</h2></div>
    <button className="skp-global-search-close" type="button" aria-label="Закрыть поиск" onClick={onClose}><X size={22}/></button>
   </div>
   <div className="skp-global-search-field">
    <Search size={21} aria-hidden="true"/>
    <input ref={input} autoFocus type="search" enterKeyHint="search"
     aria-label="Название или характеристики товара" autoComplete="off" spellCheck={false}
     placeholder="Название, модель, процессор..." value={value} onChange={event=>setValue(event.target.value)}
     onKeyDown={event=>{if(event.key==='Enter'&&visible.length>0){event.preventDefault();select(visible[0])}}}/>
    {value&&<button type="button" aria-label="Очистить поиск" onClick={()=>{setValue('');input.current?.focus()}}><X size={16}/></button>}
   </div>
   <div className="skp-global-search-meta" aria-live="polite">
    <span>{phrase?'Найдено: '+matches.length:'Популярные товары'}</span>
    {phrase&&visible.length>0&&<small>Нажмите на товар, чтобы открыть его</small>}
   </div>
   <div className="skp-global-search-results">
    {visible.map(product=>{
     const picture=getProductImages(product)[0];
     return <button key={product.id} type="button" className="skp-global-search-result" onClick={()=>select(product)}>
      <span className="skp-global-search-result-art">{picture?
       <img src={picture} alt="" loading="lazy"/>:<PackageSearch size={25} aria-hidden="true"/>}</span>
      <span className="skp-global-search-result-content">
       <small>{labels[product.category]||product.category}</small>
       <strong>{product.name}</strong>
       <em>{product.price>0?money(product.price):'Цена по запросу'}</em>
      </span><ArrowRight size={18} aria-hidden="true" className="skp-global-search-result-arrow"/>
     </button>;
    })}
    {phrase&&matches.length===0&&<div className="skp-global-search-empty">
     <PackageSearch size={34}/><strong>Ничего не найдено</strong>
     <span>Попробуйте ввести другую модель или название бренда.</span>
    </div>}
   </div>
  </section>
 </div>;
}
