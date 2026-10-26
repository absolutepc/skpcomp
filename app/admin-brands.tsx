'use client';
import {useEffect,useRef,useState} from 'react';
import {ImagePlus,Plus,Save,Search,Trash2,X,Tag,Layers} from 'lucide-react';
import type {BrandDefinition,Product} from '../lib/seed';
import {canonicalBrand} from '../lib/product-brands';
import {components,peripherals} from '../lib/catalog';
import './admin-brands.css';

type Props={
 brands:BrandDefinition[];
 products:Product[];
 onSave:(brand:BrandDefinition,previousId:string|null)=>Promise<boolean>;
 onDelete:(id:string)=>Promise<boolean>;
};
const categories:Record<string,string>={
 ...components,...peripherals,laptops:'Ноутбуки',pc:'Готовые ПК',furniture:'Компьютерная мебель'
};
function clone(brand:BrandDefinition):BrandDefinition{
 return {...brand,categories:Object.fromEntries(Object.entries(brand.categories).map(([id,series])=>[id,[...series]]))};
}
function preview(logo:string){return /^(https:\/\/|\/api\/media\?key=brands\/|\/images\/)/.test(logo)}
export default function AdminBrands({brands,products,onSave,onDelete}:Props){
 const [selected,setSelected]=useState<string|null>(null);
 const [draft,setDraft]=useState<BrandDefinition|null>(null);
 const [search,setSearch]=useState('');
 const [busy,setBusy]=useState(false);
 const [uploading,setUploading]=useState(false);
 const [message,setMessage]=useState('');
 const [error,setError]=useState('');
 const picker=useRef<HTMLInputElement|null>(null);
 const current=brands.find(item=>item.id===selected);
 const unsaved=!!draft&&(current?JSON.stringify(draft)!==JSON.stringify(current):true);
 useEffect(()=>{
  if(selected===null&&draft===null&&brands.length){
   setSelected(brands[0].id);
   setDraft(clone(brands[0]));
  }
 },[brands,selected,draft]);
 function select(brand:BrandDefinition){
  if(unsaved&&!window.confirm('Несохранённые изменения будут потеряны. Продолжить?'))return;
  setSelected(brand.id);setDraft(clone(brand));setError('');setMessage('');
 }
 function create(){
  if(unsaved&&!window.confirm('Несохранённые изменения будут потеряны. Продолжить?'))return;
  const brand={id:'brand-'+crypto.randomUUID(),name:'',logo:'',categories:{}} satisfies BrandDefinition;
  setSelected(brand.id);setDraft(brand);setError('');setMessage('');
 }
 function update(change:Partial<BrandDefinition>){
  setDraft(previous=>previous?{...previous,...change}:previous);setError('');setMessage('');
 }
 function toggleCategory(category:string){
  if(!draft)return;
  const next={...draft.categories};
  if(Object.hasOwn(next,category))delete next[category];
  else next[category]=[];
  update({categories:next});
 }
 function changeSeries(category:string,index:number,value:string){
  if(!draft)return;
  update({categories:{...draft.categories,[category]:draft.categories[category].map((name,i)=>index===i?value:name)}});
 }
 function removeSeries(category:string,index:number){
  if(!draft)return;
  update({categories:{...draft.categories,[category]:draft.categories[category].filter((_,i)=>index!==i)}});
 }
 async function save(){
  if(!draft||busy||uploading)return;
  const name=draft.name.trim();
  if(!name||name.length>80){setError('Укажи название бренда до 80 символов.');return}
  if(brands.some(brand=>brand.id!==draft.id&&brand.name.trim().toLowerCase()===name.toLowerCase())){
   setError('Бренд с таким названием уже существует.');return;
  }
  if(!Object.keys(draft.categories).length){setError('Выбери хотя бы одну категорию.');return;}
  const logo=draft.logo.trim();
  if(logo&&!preview(logo)){setError('Для логотипа используй HTTPS-ссылку или загрузи PNG/WebP.');return;}
  const cleaned:Record<string,string[]>={};
  for(const [key,items] of Object.entries(draft.categories)){
   const values=items.map(v=>v.trim()).filter(Boolean);
   if(values.some(v=>v.length>90)){setError('Название серии не должно превышать 90 символов.');return;}
   const unique=[...new Set(values.map(v=>v.toLowerCase()))];
   if(unique.length!==values.length){setError('Одна и та же серия повторяется в категории '+categories[key]+'.');return;}
   cleaned[key]=values;
  }
  const next={...draft,name,logo,categories:cleaned};
  setBusy(true);setError('');
  try{
   const ok=await onSave(next,current?.id||null);
   if(ok){setSelected(next.id);setDraft(clone(next));setMessage('Бренд и серии сохранены.');}
   else setError('Не удалось сохранить бренд.');
  }catch(cause){setError(cause instanceof Error?cause.message:'Ошибка сохранения бренда')}
  finally{setBusy(false)}
 }
 async function remove(){
  if(!current||busy)return;
  if(products.some(p=>canonicalBrand(p.brand).toLowerCase()===current.name.trim().toLowerCase())){
   setError('Нельзя удалить бренд, пока он используется в товарах.');return;
  }
  if(!window.confirm('Удалить бренд «'+current.name+'» из справочника?'))return;
  setBusy(true);setError('');
  try{
   if(await onDelete(current.id)){
    const remaining=brands.filter(brand=>brand.id!==current.id);
    const next=remaining[0]||null;
    setSelected(next?.id||null);setDraft(next?clone(next):null);setMessage('Бренд удалён.');
   }else setError('Не удалось удалить бренд.');
  }finally{setBusy(false)}
 }
 async function upload(file?:File){
  if(!file||!draft||uploading||busy)return;
  if(!['image/png','image/webp'].includes(file.type)||file.size>8*1024*1024||file.size<50){
   setError('Загрузи PNG или WebP размером до 8 МБ.');return;
  }
  setUploading(true);setError('');setMessage('');
  try{
   const body=new FormData();
   body.append('assetType','brand');body.append('brandId',draft.id);
   body.append('file',file,'brand-logo.'+(file.type==='image/png'?'png':'webp'));
   const response=await fetch('/api/media',{method:'POST',body});
   const result=await response.json() as {url?:string;error?:string};
   if(!response.ok||!result.url)throw Error(result.error||'Не удалось загрузить логотип.');
   update({logo:result.url});
   setMessage('Логотип загружен. Нажми «Сохранить бренд».');
  }catch(cause){setError(cause instanceof Error?cause.message:'Ошибка загрузки логотипа')}
  finally{setUploading(false);if(picker.current)picker.current.value=''}
 }
 const visible=brands.filter(brand=>brand.name.toLowerCase().includes(search.toLowerCase()));
 const used=products.filter(p=>canonicalBrand(p.brand).toLowerCase()===(current?.name||'').toLowerCase()).length;
 return <section className="skp-brands-admin">
  <div className="skp-brands-header"><div><h1>Бренды</h1><p>Управление производителями, логотипами и сериями для каждой категории каталога.</p></div>
   <button type="button" className="skp-brands-add" onClick={create}><Plus size={18}/> Добавить бренд</button>
  </div>
  <div className="skp-brands-layout">
   <aside className="skp-brands-list">
    <label className="skp-brands-search"><Search size={17}/><input type="search" value={search} placeholder="Поиск бренда" onChange={e=>setSearch(e.target.value)}/></label>
    <div className="skp-brands-list-items">{visible.map(brand=><button key={brand.id} type="button" className={'skp-brands-list-item'+(selected===brand.id?' selected':'')} onClick={()=>select(brand)}>
      <span className="skp-brand-thumb">{brand.logo&&preview(brand.logo)?<img src={brand.logo} alt=""/>:<Tag size={19}/>}</span>
      <span><strong>{brand.name}</strong><small>{Object.keys(brand.categories).length} категорий</small></span>
    </button>)}
    {!visible.length&&<p className="skp-brands-empty">Бренды не найдены.</p>}</div>
   </aside>
   {draft?<div className="skp-brands-editor">
    <div className="skp-brands-editor-top"><h2>{current?'Редактирование бренда':'Новый бренд'}</h2>
     {current&&<button type="button" className="skp-brands-delete" title={used?'Есть товары этого бренда':'Удалить бренд'} disabled={busy||used>0} onClick={()=>void remove()}><Trash2 size={17}/> Удалить</button>}
    </div>
    <div className="skp-brands-basics">
     <label>Название бренда<input type="text" maxLength={80} placeholder="Например, Samsung" value={draft.name} onChange={e=>update({name:e.target.value})}/></label>
     <div className="skp-brands-logo"><div className="skp-brands-logo-preview">{draft.logo&&preview(draft.logo)?<img src={draft.logo} alt={'Логотип '+(draft.name||'бренда')}/>:<ImagePlus size={30}/>}</div>
      <div className="skp-brands-logo-fields"><label>Логотип (HTTPS-ссылка)<input type="url" placeholder="https://..." value={draft.logo} onChange={e=>update({logo:e.target.value})}/></label>
       <div className="skp-brands-logo-buttons"><input ref={picker} type="file" accept="image/png,image/webp" hidden onChange={e=>void upload(e.target.files?.[0])}/>
        <button type="button" disabled={uploading||busy} onClick={()=>picker.current?.click()}><ImagePlus size={16}/>{uploading?'Загрузка…':'Загрузить PNG/WebP'}</button>
        {draft.logo&&<button type="button" onClick={()=>update({logo:''})}><X size={15}/> Убрать логотип</button>}
       </div>
      </div>
     </div>
    </div>
    <div className="skp-brands-categories-title"><div><h3>Категории и серии</h3><p>Отметь категории бренда. Для каждой можно указать собственные серии или линейки.</p></div><span><Layers size={15}/>{Object.keys(draft.categories).length}</span></div>
    <div className="skp-brands-category-grid">{Object.entries(categories).map(([id,label])=>{
     const enabled=Object.hasOwn(draft.categories,id);
     return <div key={id} className={'skp-brands-category'+(enabled?' enabled':'')}>
      <label className="skp-brands-category-toggle"><input type="checkbox" checked={enabled} onChange={()=>toggleCategory(id)}/><strong>{label}</strong></label>
      {enabled&&<div className="skp-brands-series">
       {(draft.categories[id]||[]).map((name,index)=><div className="skp-brands-series-item" key={index}>
        <input type="text" maxLength={90} value={name} placeholder="Название серии" aria-label={'Серия '+label+' '+(index+1)} onChange={e=>changeSeries(id,index,e.target.value)}/>
        <button type="button" title="Удалить серию" aria-label={'Удалить серию '+name} onClick={()=>removeSeries(id,index)}><X size={15}/></button>
       </div>)}
       <button type="button" className="skp-brands-series-add" disabled={draft.categories[id].length>=50} onClick={()=>update({categories:{...draft.categories,[id]:[...draft.categories[id],'']}})}><Plus size={14}/> Добавить серию</button>
      </div>}
     </div>;
    })}</div>
    {used>0&&<p className="skp-brands-used">Товаров этого бренда: {used}. При переименовании бренда ссылки в товарах обновятся.</p>}
    {error&&<p className="skp-brands-error" role="alert">{error}</p>}
    {message&&<p className="skp-brands-success" role="status">{message}</p>}
    <div className="skp-brands-footer"><button type="button" className="skp-brands-save" disabled={busy||uploading||!unsaved} onClick={()=>void save()}><Save size={17}/>{busy?'Сохранение…':'Сохранить бренд'}</button></div>
   </div>:<div className="skp-brands-editor skp-brands-welcome"><Tag size={32}/><h2>Добавь первый бренд</h2><p>Название, логотип, категории и серии будут доступны при создании товаров.</p><button className="skp-brands-add" type="button" onClick={create}><Plus size={18}/> Добавить бренд</button></div>}
  </div>
 </section>;
}
