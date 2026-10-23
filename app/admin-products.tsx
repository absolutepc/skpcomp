'use client';
import {useEffect,useState} from 'react';
import {Plus,Pencil,Eye,Trash2,ImageOff,ChevronLeft,ChevronRight,Armchair,Package,LayoutGrid} from 'lucide-react';
import {components,peripherals} from '../lib/catalog';
import {categoryIcons} from './catalog-icons';
import {getProductImages} from '../lib/product-gallery';
import type {Product} from '../lib/seed';
import './admin-products.css';
export type AdminProductSection='products'|'pcs'|'laptops';
export const inAdminProductSection=(p:Product,section:AdminProductSection,category?:string|null)=>{
 if(section==='pcs')return p.category==='pc';
 if(section==='laptops')return p.category==='laptops'||p.category==='laptop';
 if(p.category==='pc'||p.category==='laptops'||p.category==='laptop')return false;
 if(!category)return true;
 if(category==='other')return !Object.keys({...components,...peripherals,furniture:''}).includes(p.category);
 return p.category===category;
};
const labels:Record<string,string>={...components,...peripherals,pc:'Готовые ПК',laptops:'Ноутбуки',laptop:'Ноутбуки',furniture:'Компьютерная мебель',peripherals:'Периферия'};
const money=(price:number)=>new Intl.NumberFormat('ru-RU').format(price)+' ₽';
function Photo({product}:{product:Product}){
 const src=getProductImages(product)[0]||product.image;
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[src]);
 return <div className="skp-admin-product-photo">{src&&!failed?<img src={src} alt={product.name} loading="lazy" onError={()=>setFailed(true)}/>:<ImageOff size={22}/>}</div>;
}
export function AdminProductTable({items,onEdit,onDelete}:{items:Product[];onEdit:(p:Product)=>void;onDelete:(p:Product)=>void}){
 const [page,setPage]=useState(1),[size,setSize]=useState(10);
 const pages=Math.max(1,Math.ceil(items.length/size)),current=Math.min(page,pages);
 useEffect(()=>setPage(1),[items.length]);
 const visible=items.slice((current-1)*size,current*size);
 return <>
 <div className="skp-admin-table-scroll"><table className="skp-admin-data-table">
  <thead><tr><th>Фото</th><th>Название</th><th>Категория</th><th>Цена</th><th>Статус</th><th>Действия</th></tr></thead>
  <tbody>{visible.map(product=><tr key={product.id}><td><Photo product={product}/></td><td><button type="button" className="skp-admin-name" onClick={()=>onEdit(product)}>{product.name}</button><small className="skp-admin-brand-name">{product.brand}</small></td><td>{labels[product.category]||product.category}</td><td className="skp-admin-price">{product.price>0?money(product.price):'По запросу'}</td><td><span className={'skp-admin-stock '+(product.stock?'available':'unavailable')}>{product.stock?'В наличии':'Под заказ'}</span></td><td><div className="skp-admin-row-actions">
  <button type="button" title="Редактировать" aria-label={'Редактировать '+product.name} onClick={()=>onEdit(product)}><Pencil size={16}/></button>
  <a href={'/product/'+product.id} target="_blank" rel="noreferrer" title="Открыть товар" aria-label={'Открыть '+product.name}><Eye size={17}/></a>
  <button type="button" className="danger" title="Удалить" aria-label={'Удалить '+product.name} onClick={()=>onDelete(product)}><Trash2 size={16}/></button>
  </div></td></tr>)}</tbody>
 </table></div>
 {!items.length&&<div className="skp-admin-empty">Товары не найдены. Измените поиск или добавьте новый товар.</div>}
 <div className="skp-admin-pagination"><label>Показать по <select value={size} onChange={e=>{setSize(Number(e.target.value));setPage(1)}}>{[10,20,50].map(n=><option key={n} value={n}>{n}</option>)}</select></label><span>{items.length?((current-1)*size+1)+'–'+Math.min(current*size,items.length):'0'} из {items.length}</span><div>
 <button type="button" aria-label="Предыдущая страница" disabled={current===1} onClick={()=>setPage(current-1)}><ChevronLeft size={17}/></button>
 {Array.from({length:Math.min(5,pages)},(_,i)=>Math.max(1,Math.min(current-2,pages-4))+i).map(n=><button key={n} type="button" aria-current={n===current?'page':undefined} className={n===current?'selected':''} onClick={()=>setPage(n)}>{n}</button>)}
 <button type="button" aria-label="Следующая страница" disabled={current===pages} onClick={()=>setPage(current+1)}><ChevronRight size={17}/></button></div></div>
 </>;
}
export default function AdminProducts({products,section,search,onAdd,onEdit,onDelete}:{products:Product[];section:AdminProductSection;search:string;onAdd:(category:string)=>void;onEdit:(p:Product)=>void;onDelete:(p:Product)=>void}){
 const [category,setCategory]=useState('');
 const list=products.filter(p=>inAdminProductSection(p,section,category)).filter(p=>(p.name+' '+p.brand).toLowerCase().includes(search.toLowerCase()));
 const newCategory=section==='pcs'?'pc':section==='laptops'?'laptops':category&&category!=='other'?category:'cpu';
 const title=section==='pcs'?'Готовые ПК':section==='laptops'?'Ноутбуки':'Все товары';
 return <div className="skp-admin-products">
  <div className="skp-admin-panel-header"><div><h1>{title}</h1><p>Цены, наличие, фотографии и характеристики товаров.</p></div><button type="button" className="button light" onClick={()=>onAdd(newCategory)}><Plus size={18}/>Добавить {section==='pcs'?'ПК':section==='laptops'?'ноутбук':'товар'}</button></div>
  <div className="skp-admin-card">
   {section==='products'&&<div className="skp-admin-category-picker skp-admin-category-always-visible">
     <div className="skp-admin-category-all"><button type="button" className={!category?'selected':''} aria-pressed={!category} onClick={()=>setCategory('')}><LayoutGrid size={23} strokeWidth={1.65}/><span>Все категории</span><small>{products.filter(p=>inAdminProductSection(p,'products')).length}</small></button></div>
     {([['Комплектующие',components],['Периферия',peripherals],['Другие категории',{furniture:'Компьютерная мебель',other:'Прочие товары'}]] as const).map(([name,group])=><div key={name} className="skp-admin-category-group"><h3>{name}</h3><div>{Object.entries(group).map(([id,label])=><button type="button" key={id} aria-pressed={id===category} className={id===category?'selected':''} onClick={()=>setCategory(id)}><span className="skp-admin-category-chip-icon">{(() => {const Icon=categoryIcons[id]||(id==='furniture'?Armchair:Package);return <Icon size={23} strokeWidth={1.65}/>})()}</span><span className="skp-admin-category-chip-main"><span>{label}</span></span><small className="skp-admin-category-count">{products.filter(p=>inAdminProductSection(p,'products',id)).length}</small></button>)}</div></div>)}
   </div>}
   <AdminProductTable items={list} onEdit={onEdit} onDelete={onDelete}/>
  </div>
 </div>;
}
