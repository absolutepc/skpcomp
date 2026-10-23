'use client';
import {useState} from 'react';
import {ArrowRight, ChevronRight, Cpu, Gauge, GitCompareArrows, Info, MemoryStick, Package, ShoppingCart, SlidersHorizontal, Trash2, X, Zap} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import type {Product} from '../lib/seed';
import {categoryFields,components,peripherals,fieldValue,normalizeProduct} from '../lib/catalog';
import {getBuildRows} from '../lib/build-components';
import {getProductImages} from '../lib/product-gallery';
import {categoryIcons} from './catalog-icons';
import './compare-page.css';
import ComparisonRadar from './comparison-radar';

export const comparisonCategory=(product:Product)=>normalizeProduct(product).category;
export function comparisonLabel(category:string){return components[category]||peripherals[category]||({pc:'Готовые ПК',laptops:'Ноутбуки',furniture:'Компьютерная мебель'} as Record<string,string>)[category]||category}
const money=(amount:number)=>amount>0?new Intl.NumberFormat('ru-RU').format(amount)+' ₽':'По запросу';
const percent=(value:number)=>Math.round(value).toLocaleString('ru-RU')+'%';
type CompareRow={key:string;label:string;numeric:boolean;lowerBetter?:boolean;Icon:LucideIcon;read:(p:Product)=>string};
const icons:Record<string,LucideIcon>={
 gpu:Gauge,watts:Zap,tdp:Zap,capacity:MemoryStick,vram:MemoryStick,videoMemory:MemoryStick,
 memory:MemoryStick,ram:MemoryStick,speed:Gauge,boost:Gauge,frequency:Gauge,readSpeed:Gauge,writeSpeed:Gauge,
 core:Cpu,cores:Cpu,threads:Cpu,stock:Package
};
const lowerIsBetter=new Set(['watts','response','latency','weight']);
const safeNumber=(text:string):number|null=>{
 if(!/^\s*-?\d+(?:[.,]\d+)?\s*$/.test(text))return null;
 const number=Number(text.trim().replace(',','.'));
 return Number.isFinite(number)?number:null;
};
function ComparisonImage({product}:{product:Product}){
 const source=getProductImages(product)[0];
 return <div className="skp-cmp-product-image">{source?<img src={source} alt={product.name} loading="lazy"/>:<Package size={78} strokeWidth={1.2} aria-hidden="true"/>}</div>;
}
export default function ComparePage({
 products,onRemove,onClear,onAddCart,nav
}:{
 products:Product[];onRemove:(id:string)=>void;onClear:()=>void;onAddCart:(id:string)=>void;nav:(path:string)=>void
}){
 const [onlyDiff,setOnlyDiff]=useState(false);
 const category=products.length?comparisonCategory(products[0]):'';
 const items=products.filter(p=>comparisonCategory(p)===category).slice(0,2);
 const [left,right]=items;
 const allFields:CompareRow[]=category==='pc'
  ?Array.from(new Map(items.flatMap(p=>getBuildRows(p)).map(row=>[row.key,{key:row.key,label:row.label}])).values())
    .map(row=>({key:row.key,label:row.label,numeric:false,Icon:categoryIcons[row.key]||Package,
      read:(p:Product)=>getBuildRows(p).find(spec=>spec.key===row.key)?.value||'—'}))
  :(categoryFields[category]||[]).map(field=>({
    key:field.key,label:field.label+(field.unit?', '+field.unit:''),
    numeric:Boolean(field.numeric),lowerBetter:lowerIsBetter.has(field.key),
    Icon:icons[field.key]||categoryIcons[field.key]||SlidersHorizontal,
    read:(p:Product)=>fieldValue(p,field.key).trim()||'—'
  }));
 const allRows:CompareRow[]=[
  ...allFields,
  {key:'brand',label:'Бренд',numeric:false,Icon:Info,read:(p:Product)=>p.brand||'—'},
  {key:'stock',label:'Наличие',numeric:false,Icon:Package,read:(p:Product)=>p.stock?'В наличии':'Под заказ'}
 ].filter(row=>items.some(p=>row.read(p)!=='—'));
 const rows=allRows.filter(row=>!onlyDiff||!left||!right||row.read(left)!==row.read(right));
 const openProduct=(id:string)=>nav('/product/'+id);
 const goBack=()=>nav(category==='pc'?'/pc':'/catalog/'+(category||'all'));
 return <section className="skp-compare-page skp-cmp">
  <div className="skp-cmp-heading">
   <div><div className="skp-cmp-breadcrumb"><button type="button" onClick={()=>nav('/')}>Главная</button><ChevronRight size={15}/><span>Сравнение товаров</span></div>
    <h1>Сравнение товаров</h1><p>Сравните характеристики и выберите лучший вариант.</p></div>
   {items.length>0&&<div className="skp-cmp-top-actions">
    <label className="skp-cmp-diff-toggle"><input type="checkbox" checked={onlyDiff} onChange={event=>setOnlyDiff(event.target.checked)}/><span className="skp-cmp-switch" aria-hidden="true"/><span>Показать только отличия</span></label>
    <button type="button" className="skp-cmp-clear" onClick={onClear}><Trash2 size={18}/>Очистить сравнение</button>
   </div>}
  </div>
  {!items.length?<div className="skp-cmp-empty"><GitCompareArrows size={52}/><h2>Пока нечего сравнивать</h2><p>Добавьте два товара одной категории, чтобы увидеть разницу.</p><button type="button" className="skp-cmp-cart-button" onClick={()=>nav('/catalog/all')}>Перейти в каталог <ArrowRight size={17}/></button></div>:
  <>
   <div className="skp-cmp-hero">
    {left&&<article className="skp-cmp-product skp-cmp-product-left">
     <button type="button" className="skp-cmp-remove" onClick={()=>onRemove(left.id)} aria-label={'Убрать из сравнения '+left.name}><X size={17}/></button>
     <a href={'/product/'+left.id} className="skp-cmp-image-link" onClick={e=>{e.preventDefault();openProduct(left.id)}}><ComparisonImage product={left}/></a>
     <div className="skp-cmp-product-bottom"><div className="skp-cmp-product-description">
       <small>{left.brand||comparisonLabel(category)}</small><button type="button" onClick={()=>openProduct(left.id)}><h2>{left.name}</h2></button>
       <p>{left.description}</p><span className="skp-cmp-availability">{left.stock?'В наличии':'Под заказ'}</span>
      </div><div className="skp-cmp-product-buy"><strong>{money(left.price)}</strong><button type="button" className="skp-cmp-cart-button" disabled={!left.price} onClick={()=>onAddCart(left.id)}><ShoppingCart size={17}/>В корзину</button></div></div>
    </article>}
    <ComparisonRadar left={left} right={right} category={category}/>
    {right?<article className="skp-cmp-product skp-cmp-product-right">
     <button type="button" className="skp-cmp-remove" onClick={()=>onRemove(right.id)} aria-label={'Убрать из сравнения '+right.name}><X size={17}/></button>
     <a href={'/product/'+right.id} className="skp-cmp-image-link" onClick={e=>{e.preventDefault();openProduct(right.id)}}><ComparisonImage product={right}/></a>
     <div className="skp-cmp-product-bottom"><div className="skp-cmp-product-description">
       <small>{right.brand||comparisonLabel(category)}</small><button type="button" onClick={()=>openProduct(right.id)}><h2>{right.name}</h2></button>
       <p>{right.description}</p><span className="skp-cmp-availability">{right.stock?'В наличии':'Под заказ'}</span>
      </div><div className="skp-cmp-product-buy"><strong>{money(right.price)}</strong><button type="button" className="skp-cmp-cart-button" disabled={!right.price} onClick={()=>onAddCart(right.id)}><ShoppingCart size={17}/>В корзину</button></div></div>
    </article>:<div className="skp-cmp-empty-slot"><GitCompareArrows size={40}/><h3>Добавьте второй товар</h3><p>Выберите модель из категории «{comparisonLabel(category)}».</p><button type="button" onClick={goBack}>Выбрать товар <ArrowRight size={16}/></button></div>}
   </div>
   {right&&<><div className="skp-cmp-table-scroll"><div className="skp-cmp-specs" role="table" aria-label="Сравнение характеристик">
    <div className="skp-cmp-spec-row skp-cmp-table-header" role="row"><div role="columnheader">{left.name}</div><div role="columnheader">Характеристика</div><div role="columnheader">{right.name}</div></div>
    {rows.length?rows.map(row=>{
     const lv=row.read(left),rv=row.read(right);
     const ln=row.numeric?safeNumber(lv):null,rn=row.numeric?safeNumber(rv):null;
     const hasBars=ln!==null&&rn!==null&&ln>=0&&rn>=0&&Math.max(ln,rn)>0;
     const max=Math.max(ln||0,rn||0);
     const change=hasBars&&ln!==0?(rn!-ln!)/ln!*100:null;
     const rightBetter=change!==null&&Math.abs(change)>=.5?(row.lowerBetter?change<0:change>0):null;
     const Icon=row.Icon;
     return <div className={'skp-cmp-spec-row'+(lv!==rv?' differs':'')} key={row.key} role="row">
      <div role="cell" className="skp-cmp-spec-side skp-cmp-spec-left">
       {hasBars&&<div className="skp-cmp-bar-track"><span style={{width:Math.max(5,(ln!/max)*100)+'%'}}/></div>}
       <span className="skp-cmp-spec-value">{lv}</span>
      </div>
      <div role="rowheader" className="skp-cmp-spec-name"><Icon size={19} strokeWidth={1.9}/><span>{row.label}</span></div>
      <div role="cell" className="skp-cmp-spec-side skp-cmp-spec-right"><span className="skp-cmp-spec-value">{rv}</span>
       {hasBars&&<div className="skp-cmp-bar-track"><span style={{width:Math.max(5,(rn!/max)*100)+'%'}}/></div>}
       {change!==null&&Math.abs(change)>=.5?<span className={'skp-cmp-diff-badge '+(rightBetter?'better':'worse')}>{change>0?'+':''}{percent(change)}</span>:<span className="skp-cmp-no-delta">—</span>}
      </div>
     </div>;
    }):<div className="skp-cmp-no-specs">Нет характеристик с выбранными условиями. Отключите переключатель «Показать только отличия».</div>}
   </div></div>
   <p className="skp-cmp-note"><Info size={14}/>Полосы показывают относительные числовые значения характеристик. Более высокое значение не всегда означает лучшую производительность.</p>
   </>}
  </>}
 </section>;
}

