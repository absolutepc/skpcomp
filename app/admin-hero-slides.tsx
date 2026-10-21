'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowDown,ArrowUp,ImagePlus,Pencil,Plus,Save,Trash2,X} from 'lucide-react';
import {createHeroSlide,defaultHeroSlides,HERO_LAYOUTS,MAX_HERO_SLIDES,moveHeroSlide,validateHeroSlides,type HeroSlide} from '../lib/hero-slides';
import './admin-hero-slides.css';

const layoutNames:Record<HeroSlide['layout'],string>={
 logitech:'Два вертикальных продукта (Logitech)',
 premium:'Премиальный продукт в рамке',
 rog:'Два продукта (ASUS ROG)',
 single:'Одна фотография',
 duo:'Две фотографии'
};
async function prepareSlideImage(file:File):Promise<Blob>{
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Выберите PNG, JPG или WebP.');
 if(file.size>20*1024*1024)throw Error('Размер исходного изображения — не более 20 МБ.');
 const bitmap=await createImageBitmap(file);
 try{
  const factor=Math.min(1,2000/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(bitmap.width*factor));
  canvas.height=Math.max(1,Math.round(bitmap.height*factor));
  const ctx=canvas.getContext('2d');
  if(!ctx)throw Error('Не удалось обработать изображение.');
  ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/webp',.87));
  if(!blob||blob.type!=='image/webp'||blob.size>8*1024*1024)throw Error('Не удалось подготовить WebP размером до 8 МБ.');
  return blob;
 }finally{bitmap.close()}
}
export default function AdminHeroSlides({slides=defaultHeroSlides,onSave}:{slides?:HeroSlide[];onSave:(next:HeroSlide[])=>Promise<boolean>}){
 const [draft,setDraft]=useState<HeroSlide[]>(slides);
 const [expanded,setExpanded]=useState<string|null>(null);
 const [dirty,setDirty]=useState(false);
 const [saving,setSaving]=useState(false);
 const [uploading,setUploading]=useState('');
 const [error,setError]=useState('');
 const [success,setSuccess]=useState('');
 const picker=useRef<HTMLInputElement|null>(null);
 const uploadTarget=useRef<{id:string;secondary:boolean}|null>(null);
 useEffect(()=>{setDraft(slides);setDirty(false)},[slides]);
 const change=(next:HeroSlide[])=>{setDraft(next);setDirty(true);setError('');setSuccess('')};
 const edit=(id:string,fields:Partial<HeroSlide>)=>change(draft.map(s=>s.id===id?{...s,...fields}:s));
 const add=()=>{
  if(draft.length>=MAX_HERO_SLIDES){setError('Можно добавить не более 12 слайдов.');return}
  const slide=createHeroSlide();
  change([...draft,slide]);setExpanded(slide.id);
 };
 const remove=(id:string)=>{
  const slide=draft.find(s=>s.id===id);
  if(!slide||!window.confirm('Удалить слайд «'+slide.label+'»? Изменение вступит в силу после сохранения.'))return;
  change(draft.filter(s=>s.id!==id));
  if(expanded===id)setExpanded(null);
 };
 const save=async()=>{
  setError('');setSuccess('');
  if(!validateHeroSlides(draft)){
   setError('Проверьте обязательные поля: название, заголовок, кнопки, внутренние ссылки и изображения. Для двойного слайда нужны два фото.');
   return;
  }
  setSaving(true);
  try{
   const ok=await onSave(draft);
   if(ok){setDirty(false);setSuccess('Слайды сохранены. Изменения появились на главной странице.')}
   else setError('Не удалось сохранить слайды. Проверьте сообщение сайта и повторите попытку.');
  }catch(e){setError(e instanceof Error?e.message:'Не удалось сохранить изменения.')}
  finally{setSaving(false)}
 };
 const pickImage=(id:string,secondary:boolean)=>{
  uploadTarget.current={id,secondary};
  picker.current?.click();
 };
 const upload=async(file:File|undefined)=>{
  const target=uploadTarget.current;
  if(!file||!target||uploading)return;
  setUploading(target.id);setError('');setSuccess('');
  try{
   const image=await prepareSlideImage(file);
   const body=new FormData();
   body.append('assetType','slide');
   body.append('slideId',target.id);
   body.append('file',image,'slide.webp');
   const response=await fetch('/api/media',{method:'POST',body});
   const result=await response.json() as {url?:string;error?:string};
   if(!response.ok||!result.url)throw Error(result.error||'Не удалось загрузить изображение.');
   edit(target.id,target.secondary?{image2:result.url}:{image:result.url});
   setSuccess('Изображение загружено. Нажмите «Сохранить слайды», чтобы применить изменения.');
  }catch(e){setError(e instanceof Error?e.message:'Ошибка загрузки.')}
  finally{setUploading('');if(picker.current)picker.current.value='';uploadTarget.current=null}
 };
 return <section className="skp-admin-hero" aria-label="Редактор слайдов главной страницы">
  <div className="skp-admin-hero-heading">
   <div><span className="eyebrow">SKP / ГЛАВНАЯ</span><h2>Слайды главной страницы</h2>
    <p>Добавляйте слайды, меняйте текст, изображения, ссылки и порядок. Интервал переключения — 5 секунд, высота всех слайдов одинаковая.</p></div>
   <span className="skp-hero-count">{draft.length}/{MAX_HERO_SLIDES}</span>
  </div>
  <div className="skp-hero-toolbar">
   <button type="button" className="button outline" onClick={add} disabled={draft.length>=MAX_HERO_SLIDES}><Plus size={16}/> Добавить слайд</button>
   <button type="button" className="button light" onClick={()=>void save()} disabled={saving||Boolean(uploading)||!dirty}><Save size={16}/>{saving?'Сохранение…':'Сохранить слайды'}</button>
   {dirty&&<span className="skp-hero-unsaved">Есть несохранённые изменения</span>}
  </div>
  <input ref={picker} type="file" accept="image/png,image/jpeg,image/webp" className="skp-hero-hidden-input"
   onChange={e=>void upload(e.target.files?.[0])}/>
  {error&&<p className="skp-hero-error" role="alert">{error}</p>}
  {success&&<p className="skp-hero-success" role="status">{success}</p>}
  {!draft.length&&<p className="skp-hero-empty">Слайдов нет. Карусель будет скрыта, пока вы не добавите новый слайд.</p>}
  <div className="skp-hero-admin-list">{draft.map((slide,index)=><article key={slide.id} className="skp-hero-admin-item">
   <div className="skp-hero-admin-row">
    <div className="skp-hero-thumb">{slide.image?<img src={slide.image} alt="Предпросмотр слайда"/>:<ImagePlus size={26}/>}</div>
    <div className="skp-hero-admin-info"><strong>{index+1}. {slide.label}</strong><small>{layoutNames[slide.layout]} · {slide.primary}</small></div>
    <div className="skp-hero-admin-actions">
     <button type="button" title="Поднять выше" aria-label={'Переместить вверх: '+slide.label} disabled={index===0} onClick={()=>change(moveHeroSlide(draft,index,-1))}><ArrowUp size={17}/></button>
     <button type="button" title="Опустить ниже" aria-label={'Переместить вниз: '+slide.label} disabled={index===draft.length-1} onClick={()=>change(moveHeroSlide(draft,index,1))}><ArrowDown size={17}/></button>
     <button type="button" title="Редактировать" aria-label={'Редактировать: '+slide.label} aria-expanded={expanded===slide.id}
      onClick={()=>setExpanded(expanded===slide.id?null:slide.id)}>{expanded===slide.id?<X size={17}/>:<Pencil size={17}/>}</button>
     <button type="button" className="skp-hero-delete" aria-label={'Удалить: '+slide.label} title="Удалить слайд" onClick={()=>remove(slide.id)}><Trash2 size={17}/></button>
    </div>
   </div>
   {expanded===slide.id&&<div className="skp-hero-edit">
    <div className="skp-hero-fields">
     <label>Название в админке<input maxLength={120} value={slide.label} onChange={e=>edit(slide.id,{label:e.target.value})}/></label>
     <label>Надпись над заголовком<input maxLength={110} value={slide.eyebrow} onChange={e=>edit(slide.id,{eyebrow:e.target.value})}/></label>
     <label className="skp-hero-wide">Заголовок (каждая строка — с новой строки)<textarea rows={3} maxLength={150} value={slide.title} onChange={e=>edit(slide.id,{title:e.target.value,highlightLine:Math.min(slide.highlightLine,e.target.value.split('\n').length-1)})}/></label>
     <label>Строка заголовка жёлтым цветом<select value={slide.highlightLine} onChange={e=>edit(slide.id,{highlightLine:Number(e.target.value)})}>{slide.title.split('\n').map((line,i)=><option key={i} value={i}>{i+1}. {line||'Пустая строка'}</option>)}</select></label>
     <label>Оформление слайда<select value={slide.layout} onChange={e=>edit(slide.id,{layout:e.target.value as HeroSlide['layout']})}>{HERO_LAYOUTS.map(layout=><option key={layout} value={layout}>{layoutNames[layout]}</option>)}</select></label>
     <label className="skp-hero-wide">Описание<textarea rows={3} maxLength={500} value={slide.description} onChange={e=>edit(slide.id,{description:e.target.value})}/></label>
     <label>Основная кнопка<input maxLength={45} value={slide.primary} onChange={e=>edit(slide.id,{primary:e.target.value})}/></label>
     <label>Ссылка основной кнопки<input maxLength={300} placeholder="/catalog/all" value={slide.href} onChange={e=>edit(slide.id,{href:e.target.value})}/></label>
     <label>Дополнительная кнопка<input maxLength={45} value={slide.secondary} onChange={e=>edit(slide.id,{secondary:e.target.value})}/></label>
     <label>Ссылка дополнительной кнопки<input maxLength={300} placeholder="/configurator" value={slide.secondHref} onChange={e=>edit(slide.id,{secondHref:e.target.value})}/></label>
    </div>
    <div className="skp-hero-photos">{([false,...(['logitech','rog','duo'].includes(slide.layout)?[true]:[])] as boolean[]).map(secondary=>{
     const key=secondary?'image2':'image',captionKey=secondary?'caption2':'caption',url=slide[key];
     return <div key={key} className="skp-hero-photo-control">
      <strong>{secondary?'Второе изображение':'Основное изображение'}</strong>
      <div className="skp-hero-photo-preview">{url?<img src={url} alt={secondary?'Второй продукт':'Первый продукт'}/>:<ImagePlus size={24}/>}</div>
      <label>Адрес изображения<input value={url} maxLength={1600} placeholder="/images/photo.webp или https://…" onChange={e=>edit(slide.id,{[key]:e.target.value})}/></label>
      <button type="button" className="button outline" onClick={()=>pickImage(slide.id,secondary)} disabled={Boolean(uploading)}><ImagePlus size={15}/>{uploading===slide.id?'Загрузка…':'Загрузить PNG / JPG / WebP'}</button>
      <label>Подпись к изображению<input value={slide[captionKey]} maxLength={80} onChange={e=>edit(slide.id,{[captionKey]:e.target.value})}/></label>
     </div>;
    })}</div>
    <p className="skp-hero-media-note">Фото сохраняются в R2 (binding MEDIA). Если хранилище ещё не подключено, используйте существующий путь /images/… или прямую HTTPS-ссылку. Изменения текста, порядка и адресов применяются после «Сохранить слайды».</p>
   </div>}
  </article>)}</div>
 </section>;
}
