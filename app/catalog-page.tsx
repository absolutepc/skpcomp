'use client';
import {useState} from 'react';
import CatalogRange from './catalog-range';
import './catalog-filters.css';
import {Search,SlidersHorizontal,X,LayoutGrid} from 'lucide-react';
import {categoryIcons} from './catalog-icons';
import {Product} from '../lib/seed';
import {components,peripherals,categoryFields,fieldValue,splitValues,inCategory,matchesFilters,Facets,Ranges} from '../lib/catalog';
const groups:Record<string,string>={all:'Все товары',components:'Комплектующие',peripherals:'Периферия',laptops:'Ноутбуки',furniture:'Компьютерная мебель'};
export default function CatalogPage({category,products,nav,card}:{category:string;products:Product[];nav:(p:string)=>void;card:(p:Product)=>React.ReactNode}){
 const [query,setQuery]=useState(''),[sort,setSort]=useState('popular'),[min,setMin]=useState(''),[max,setMax]=useState(''),[stock,setStock]=useState(false),[facets,setFacets]=useState<Facets>({}),[ranges,setRanges]=useState<Ranges>({}),[open,setOpen]=useState(false);
 const parent=category==='components'||category in components?'components':category==='peripherals'||category in peripherals?'peripherals':category;
 const subdivisions=parent==='components'?components:parent==='peripherals'?peripherals:null;
 const base=products.filter(p=>inCategory(p,category));
 const fields=[{key:'brand',label:'Бренд'},...(categoryFields[category]||[])];
 const shown=base.filter(p=>(p.name+' '+p.description+' '+p.brand).toLocaleLowerCase('ru').includes(query.trim().toLocaleLowerCase('ru'))&&(!min||p.price>=Number(min))&&(!max||p.price<=Number(max))&&(!stock||p.stock)&&matchesFilters(p,facets,ranges));
 if(sort!=='popular')shown.sort((a,b)=>sort==='low'?a.price-b.price:sort==='high'?b.price-a.price:a.name.localeCompare(b.name,'ru'));
 const count=Object.values(facets).reduce((s,a)=>s+a.length,0)+Object.values(ranges).filter(r=>r.min||r.max).length+Number(!!min||!!max)+Number(stock);
 function reset(){setFacets({});setRanges({});setMin('');setMax('');setStock(false);setQuery('')}
 const link=(id:string,label:string,active:boolean)=><a key={id} href={'/catalog/'+id} className={active?'selected':''} aria-current={active?'page':undefined} onClick={e=>{e.preventDefault();nav('/catalog/'+id)}}>{label}</a>;
 return <section className="catalog-page"><div className="breadcrumb">SKP / Каталог{subdivisions?' / '+groups[parent]:''}</div><h1>{components[category]||peripherals[category]||groups[category]||'Каталог'}</h1><div className="catalog-tabs">{Object.entries(groups).map(([id,label])=>link(id,label,parent===id))}</div>{subdivisions&&<nav className="catalog-subcategories" aria-label="Подразделы каталога">{[[parent,'Все категории'],...Object.entries(subdivisions)].map(([id,label])=>{const Icon=categoryIcons[id]||LayoutGrid;return <a key={id} href={'/catalog/'+id} className={category===id?'selected':''} aria-current={category===id?'page':undefined} onClick={e=>{e.preventDefault();nav('/catalog/'+id)}}><span className="subcategory-icon"><Icon size={27} strokeWidth={1.5} aria-hidden="true"/></span><span>{label}</span></a>})}</nav>}
 <div className="catalog-toolbar"><div className="search"><Search size={18}/><input id="search" aria-label="Поиск товаров" placeholder="Поиск в разделе" value={query} onChange={e=>setQuery(e.target.value)}/></div><select aria-label="Сортировка товаров" value={sort} onChange={e=>setSort(e.target.value)}><option value="popular">По умолчанию</option><option value="low">Сначала дешевле</option><option value="high">Сначала дороже</option><option value="name">По названию</option></select><button className="catalog-filter-toggle button outline" aria-expanded={open} aria-controls="category-filters" onClick={()=>setOpen(!open)}><SlidersHorizontal size={17}/> Фильтры {count>0&&`(${count})`}</button></div>
 <div className="catalog-layout"><aside id="category-filters" className={'catalog-facets'+(open?' is-open':'')}><div className="facet-title"><h2>Фильтры</h2><button onClick={reset}>Сбросить</button></div><fieldset><legend>Цена, ₽</legend><CatalogRange label="Цена" values={base.map(p=>p.price).filter(price=>price>0)} value={{min,max}} onChange={value=>{setMin(value.min||'');setMax(value.max||'')}}/></fieldset><label className="facet-checkbox"><input type="checkbox" checked={stock} onChange={e=>setStock(e.target.checked)}/> Только в наличии</label>
 {fields.map(field=>{
 const options=Array.from(new Set(base.flatMap(p=>splitValues(fieldValue(p,field.key))))).sort((a,b)=>a.localeCompare(b,'ru',{numeric:true}));
 const range=ranges[field.key]||{};
 const toggle=(option:string)=>setFacets({...facets,[field.key]:(facets[field.key]||[]).includes(option)?facets[field.key].filter(x=>x!==option):[...(facets[field.key]||[]),option]});
 const inline=(category==='cpu'&&['brand','socket','memory'].includes(field.key))||category==='motherboard';
 return <fieldset key={field.key}><legend>{field.label}{field.unit?`, ${field.unit}`:''}</legend>
 {field.numeric?<CatalogRange label={field.label} values={base.map(p=>fieldValue(p,field.key)).filter(v=>v.trim()!=='').map(v=>Number(v.replace(',','.')))} value={range} onChange={value=>setRanges({...ranges,[field.key]:value})}/>
 :options.length?<div className={inline?'skp-facet-buttons':'facet-values'}>{options.map(option=>inline?
 <button type="button" key={option} aria-pressed={(facets[field.key]||[]).includes(option)} onClick={()=>toggle(option)}>{option}</button>:
 <label className="facet-checkbox" key={option}><input type="checkbox" checked={(facets[field.key]||[]).includes(option)} onChange={()=>toggle(option)}/><span>{option}</span><small>{base.filter(p=>splitValues(fieldValue(p,field.key)).includes(option)).length}</small></label>)}</div>
 :<small className="facet-no-data">Нет заполненных значений</small>}</fieldset>;
 })}<button className="button light catalog-filter-close" onClick={()=>setOpen(false)}>Показать товары ({shown.length})</button></aside>
 <div className="catalog-results"><div className="catalog-result-line"><span aria-live="polite">Найдено товаров: {shown.length}</span>{(count>0||query)&&<button onClick={reset}><X size={14}/> Сбросить всё</button>}</div>{(Object.values(facets).some(values=>values.length>0)||Object.values(ranges).some(range=>!!range.min||!!range.max))&&<div className="active-facets">{Object.entries(facets).flatMap(([key,values])=>values.map(v=><button key={key+v} onClick={()=>setFacets({...facets,[key]:values.filter(x=>x!==v)})}>{fields.find(f=>f.key===key)?.label}: {v}<X size={12}/></button>))}{Object.entries(ranges).filter(([,r])=>r.min||r.max).map(([key,r])=><button key={key} onClick={()=>setRanges({...ranges,[key]:{}})}>{fields.find(f=>f.key===key)?.label}: {r.min||'0'} — {r.max||'∞'}<X size={12}/></button>)}</div>}<div className="grid">{shown.map(card)}</div>{!shown.length&&<div className="empty"><h2>{base.length?'Нет товаров с такими параметрами':'В этом разделе пока нет товаров'}</h2><p>{base.length?'Попробуйте изменить фильтры.':'Новые товары появятся здесь после добавления в каталог.'}</p>{base.length>0&&<button className="button outline" onClick={reset}>Сбросить фильтры</button>}</div>}</div></div></section>
}
