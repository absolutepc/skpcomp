'use client';
import {useState} from 'react';
import {ArrowLeft,Boxes,ImageOff,Plus,Trash2,Armchair,Laptop,Monitor} from 'lucide-react';
import {components,peripherals} from '../lib/catalog';
import {categoryIcons} from './catalog-icons';
import {getProductImages} from '../lib/product-gallery';
import type {Product} from '../lib/seed';
import './admin-products.css';

const componentTypes=Object.entries(components);
const peripheralTypes=Object.entries(peripherals);
const standardCategories=new Set([...Object.keys(components),...Object.keys(peripherals),'pc','laptops','laptop','furniture']);
const otherCategories=[
 {id:'furniture',label:'Компьютерная мебель',Icon:Armchair},
 {id:'other',label:'Прочие товары',Icon:Boxes}
];
const money=(price:number)=>new Intl.NumberFormat('ru-RU').format(price)+' ₽';
export type AdminProductSection='products'|'pcs'|'laptops';
export const inAdminProductSection=(p:Product,section:AdminProductSection,category?:string|null)=>{
 if(section==='pcs')return p.category==='pc';
 if(section==='laptops')return p.category==='laptops'||p.category==='laptop';
 if(p.category==='pc'||p.category==='laptops'||p.category==='laptop')return false;
 if(!category)return true;
 if(category==='other')return !standardCategories.has(p.category);
 return p.category===category;
};

function Photo({product}:{product:Product}){
 const src=getProductImages(product)[0]||product.image;
 const [failed,setFailed]=useState(false);
 return <div className="skp-admin-product-photo">
  {src&&!failed?<img src={src} alt={'Главное фото: '+product.name} loading="lazy" onError={()=>setFailed(true)}/>:<ImageOff size={23} aria-hidden="true"/>}
 </div>;
}
function ProductRows({items,onEdit,onDelete}:{items:Product[];onEdit:(product:Product)=>void;onDelete:(product:Product)=>void}){
 if(!items.length)return <div className="skp-admin-empty">В этом разделе пока нет товаров. Добавьте первый, чтобы он появился в каталоге.</div>;
 return <div className="skp-admin-products-list">
  {items.map(product=><div className="skp-admin-product-row" key={product.id}>
   <Photo product={product}/>
   <div className="skp-admin-product-info"><strong>{product.name}</strong>
    <small>{components[product.category]||peripherals[product.category]||
     (product.category==='pc'?'Готовый ПК':product.category==='laptops'||product.category==='laptop'?'Ноутбук':product.category==='furniture'?'Компьютерная мебель':product.category)}
     <span className={product.stock?'in-stock':'out-of-stock'}>{product.stock?'В наличии':'Под заказ'}</span></small>
   </div>
   <span className="skp-admin-product-price">{product.price>0?money(product.price):'Цена не задана'}</span>
   <button className="skp-admin-product-edit" type="button" onClick={()=>onEdit(product)}>Изменить</button>
   <button className="skp-admin-product-delete" type="button" title={'Удалить '+product.name}
    aria-label={'Удалить '+product.name} onClick={()=>onDelete(product)}><Trash2 size={17}/></button>
  </div>)}
 </div>;
}
function CategoryTiles({title,items,products,onChoose}:{
 title:string;items:{id:string;label:string;Icon:typeof Monitor}[];products:Product[];onChoose:(id:string)=>void
}){
 return <section className="skp-admin-category-group">
  <h3>{title}</h3>
  <div className="skp-admin-categories">
   {items.map(({id,label,Icon})=><button type="button" className="skp-admin-category-tile" key={id}
    onClick={()=>onChoose(id)} aria-label={label}>
    <span className="skp-admin-category-icon"><Icon size={24} strokeWidth={1.65} aria-hidden="true"/></span>
    <span className="skp-admin-category-name">{label}</span>
    <span className="skp-admin-category-count">{products.filter(p=>inAdminProductSection(p,'products',id)).length}</span>
   </button>)}
  </div>
 </section>;
}

export default function AdminProducts({products,section,onAdd,onEdit,onDelete}:{
 products:Product[];section:AdminProductSection;onAdd:(category:string)=>void;
 onEdit:(product:Product)=>void;onDelete:(product:Product)=>void;
}){
 const [category,setCategory]=useState<string|null>(null);
 const componentsWithIcons=componentTypes.map(([id,label])=>({id,label,Icon:categoryIcons[id]}));
 const peripheralsWithIcons=peripheralTypes.map(([id,label])=>({id,label,Icon:categoryIcons[id]}));
 const extra=otherCategories.map(({id,label,Icon})=>({id,label,Icon}));
 const sections=section==='pcs'?'Готовые ПК':section==='laptops'?'Ноутбуки':'Товары';
 const categoryName=[...componentTypes,...peripheralTypes,...extra.map(c=>[c.id,c.label])].find(([id])=>id===category)?.[1];
 const list=products.filter(p=>inAdminProductSection(p,section,category));
 const newCategory=section==='pcs'?'pc':section==='laptops'?'laptops':category&&category!=='other'?category:'peripherals';
 if(section==='products'&&!category)return <div className="skp-admin-products">
  <div className="skp-admin-panel-header"><div><h2>Товары <span className="muted">/ {list.length}</span></h2>
   <p>Выберите подраздел, чтобы посмотреть товары, изменить их или добавить новые.</p></div>
  </div>
  <CategoryTiles title="Комплектующие" items={componentsWithIcons} products={products} onChoose={setCategory}/>
  <CategoryTiles title="Периферия" items={peripheralsWithIcons} products={products} onChoose={setCategory}/>
  <CategoryTiles title="Другие категории" items={extra} products={products} onChoose={setCategory}/>
 </div>;
 return <div className="skp-admin-products">
  {section==='products'&&<button type="button" className="skp-admin-category-back" onClick={()=>setCategory(null)}>
   <ArrowLeft size={16}/> Все подразделы товаров
  </button>}
  <div className="skp-admin-panel-header"><div>
   <h2>{categoryName||sections} <span className="muted">/ {list.length}</span></h2>
   <p>{section==='pcs'?'Готовые сборки и их характеристики.':
    section==='laptops'?'Каталог ноутбуков, цены и наличие.':'Товары выбранного подраздела.'}</p>
  </div><button type="button" className="button light" onClick={()=>onAdd(newCategory)}>
   {section==='pcs'?'Добавить ПК':section==='laptops'?'Добавить ноутбук':'Добавить товар'} <Plus size={17}/>
  </button></div>
  <ProductRows items={list} onEdit={onEdit} onDelete={onDelete}/>
 </div>;
}
