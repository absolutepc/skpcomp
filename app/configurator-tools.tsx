'use client';

import {useEffect,useRef,useState} from 'react';
import {AlertTriangle,CheckCircle2,ClipboardCopy,HardDriveDownload,Save,Share2,Trash2,Wallet,Zap,X} from 'lucide-react';
import type {Product} from '../lib/seed';
import type {BuildAnalysis,BuildSelection} from '../lib/pc-builder';
import {readSavedBuilds,writeSavedBuilds,saveNamedBuild,getShareUrl,type SavedBuild,MAX_SAVED_BUILDS} from '../lib/saved-builds';
import './configurator-tools.css';

const watts=(n:number)=>new Intl.NumberFormat('ru-RU').format(n)+' Вт';
export function BuildDiagnostics({analysis}:{analysis:BuildAnalysis}){
 const errors=analysis.issues.filter(issue=>issue.severity==='error');
 const warnings=analysis.issues.filter(issue=>issue.severity==='warning');
 const {power}=analysis;
 return <div className="skp-build-checks" aria-label="Проверка совместимости и питания">
  <div className="skp-build-checks-title">
   {errors.length?<AlertTriangle size={19}/>:<CheckCircle2 size={19}/>}
   <strong>Проверка совместимости</strong>
   <span className={errors.length?'bad':warnings.length?'caution':'ok'}>{errors.length?errors.length+' конфликт(ов)':analysis.checked+'/8 компонентов'}</span>
  </div>
  {errors.length===0&&<p className="skp-check-positive">{analysis.checked===8?'Конфликтов по заполненным характеристикам нет.':'Выбирайте компоненты — совместимость обновляется автоматически.'}</p>}
  {!!analysis.issues.length&&<ul className="skp-check-issues">{analysis.issues.map(issue=>
   <li className={issue.severity} key={issue.code}><AlertTriangle size={14}/><span>{issue.message}</span></li>
  )}</ul>}
  <p className="skp-check-caveat">Проверяются сокет, DDR, форм-фактор, кулер, размеры, слоты памяти и питание — если характеристики указаны в каталоге. BIOS, разъёмы питания, точные зазоры и комплектацию подтвердит менеджер.</p>
  <div className="skp-power-title"><Zap size={18}/><strong>Калькулятор питания</strong></div>
  <div className="skp-power-metrics">
   <div><small>Оценка потребления</small><strong>{watts(power.drawWatts)}</strong></div>
   <div><small>БП с запасом 35%</small><strong>{power.knownLoads?watts(power.recommendedWatts):'Недостаточно данных'}</strong></div>
   <div><small>Выбранный блок</small><strong>{power.supplyWatts?watts(power.supplyWatts):'Не выбран'}</strong></div>
  </div>
  {power.knownLoads&&power.supplyWatts!==null&&<div className="skp-power-range">
   <div className="skp-power-bar"><i style={{width:Math.min(100,Math.round(power.drawWatts/power.supplyWatts*100))+'%'}}/></div>
   <small>{power.reserveWatts!==null&&power.reserveWatts>=0?'Запас по мощности: '+watts(power.reserveWatts):'Нагрузка превышает заявленную мощность БП'}</small>
  </div>}
  {!power.knownLoads&&<p className="skp-power-pending">Для рекомендации БП добавьте CPU и GPU с указанным потреблением. Пока показана только известная часть нагрузки.</p>}
  <details className="skp-power-details"><summary>Расчёт потребления по компонентам</summary>
   {power.rows.map(row=><div key={row.label}><span>{row.label}{row.estimated?' *':''}</span><strong>{row.watts?watts(row.watts):'Не указано'}</strong></div>)}
   <p>* Вспомогательные нагрузки оценочные. Значения CPU/GPU взяты из характеристик товара. Расчёт не заменяет проверку реального энергопотребления, коннекторов и рекомендаций производителя.</p>
  </details>
 </div>;
}
export function SavedBuildLibrary({selected,products,onLoad,notify}:{selected:BuildSelection;products:Product[];onLoad:(value:BuildSelection)=>void;notify:(text:string)=>void}){
 const [list,setList]=useState<SavedBuild[]>([]);
 const [name,setName]=useState('Моя сборка');
 useEffect(()=>{try{setList(readSavedBuilds(localStorage,products))}catch{}},[products]);
 const handleSave=()=>{
  try{const next=saveNamedBuild(localStorage,products,selected,name);setList(next);notify('Сборка «'+(name.trim()||'Моя сборка')+'» сохранена')}
  catch(error){notify(error instanceof Error?error.message:'Не удалось сохранить сборку')}
 };
 const remove=(id:string)=>{
  try{const next=list.filter(build=>build.id!==id);writeSavedBuilds(localStorage,next);setList(next);notify('Сборка удалена')}
  catch{notify('Не удалось удалить сборку')}
 };
 const share=async(value:BuildSelection)=>{
  try{
   const url=getShareUrl(value,products,location.origin);
   if(!navigator.clipboard?.writeText)throw Error('Копирование недоступно');
   await navigator.clipboard.writeText(url);
   notify('Ссылка на сборку скопирована');
  }catch{notify('Не удалось скопировать ссылку. Проверьте разрешение браузера')}
 };
 return <section className="skp-saved-builds" aria-label="Сохранённые конфигурации" id="skp-saved-builds">
  <div className="skp-saved-title"><div><Save size={21}/><h2>Мои конфигурации</h2></div><span>{list.length}/{MAX_SAVED_BUILDS}</span></div>
  <p>Храните несколько вариантов в этом браузере, открывайте их позже или делитесь ссылкой. Сохранение не требует аккаунта.</p>
  <div className="skp-saved-controls">
   <label>Название сборки<input aria-label="Название сборки" maxLength={60} placeholder="Например, Игровой ПК" value={name} onChange={e=>setName(e.target.value)}/></label>
   <button type="button" className="button light" onClick={handleSave}><Save size={16}/> Сохранить</button>
   <button type="button" className="button outline" disabled={!Object.keys(selected).length} onClick={()=>void share(selected)}><Share2 size={16}/> Поделиться текущей</button>
  </div>
  {list.length?<div className="skp-saved-list">{list.map(build=>
   <article className="skp-saved-item" key={build.id}>
    <div><strong>{build.name}</strong><small>{Object.keys(build.selected).length} компонентов · {new Date(build.updatedAt).toLocaleDateString('ru-RU')}</small></div>
    <div className="skp-saved-actions">
     <button type="button" onClick={()=>{onLoad(build.selected);notify('Сборка загружена')}}><HardDriveDownload size={15}/> Открыть</button>
     <button type="button" title="Скопировать ссылку" aria-label={'Поделиться '+build.name} onClick={()=>void share(build.selected)}><ClipboardCopy size={16}/></button>
     <button type="button" title="Удалить" aria-label={'Удалить '+build.name} onClick={()=>remove(build.id)}><Trash2 size={16}/></button>
    </div>
   </article>
  )}</div>:<p className="skp-saved-empty">Сохранённых сборок пока нет. Выберите комплектующие и нажмите «Сохранить».</p>}
 </section>;
}


/**
 * Phone-only save confirmation. Uses exactly the same storage helpers as
 * SavedBuildLibrary; the desktop inline library is deliberately untouched.
 */
export function MobileSaveBuildModal({selected,products,total,notify,onSaved,onClose}:{
 selected:BuildSelection;
 products:Product[];
 total:number;
 notify:(message:string)=>void;
 onSaved:()=>void;
 onClose:()=>void;
}){
 const [name,setName]=useState('Моя сборка');
 const [error,setError]=useState('');
 const input=useRef<HTMLInputElement>(null);
 const count=Object.keys(selected).filter(key=>products.some(product=>product.id===selected[key])).length;
 useEffect(()=>{
  const previousOverflow=document.body.style.overflow;
  const previousFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
  document.body.style.overflow='hidden';
  const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape')onClose()};
  document.addEventListener('keydown',onKey);
  input.current?.focus({preventScroll:true});
  return ()=>{
   document.body.style.overflow=previousOverflow;
   document.removeEventListener('keydown',onKey);
   previousFocus?.focus({preventScroll:true});
  };
 },[onClose]);
 const submit=(event:React.FormEvent<HTMLFormElement>)=>{
  event.preventDefault();
  try{
   saveNamedBuild(localStorage,products,selected,name);
   notify('Конфигурация «'+(name.trim().slice(0,60)||'Моя сборка')+'» сохранена');
   onSaved();
   onClose();
  }catch(cause){
   setError(cause instanceof Error?cause.message:'Не удалось сохранить конфигурацию');
  }
 };
 return <div className="skp-mobile-save-overlay" onPointerDown={event=>{if(event.target===event.currentTarget)onClose()}}>
  <section role="dialog" aria-modal="true" aria-labelledby="skp-mobile-save-title"
   aria-describedby="skp-mobile-save-explainer" className="skp-mobile-save-dialog">
   <div className="skp-mobile-save-top">
    <span className="skp-mobile-save-icon"><Save size={20}/></span>
    <button type="button" onClick={onClose} aria-label="Закрыть окно сохранения" className="skp-mobile-save-close"><X size={22}/></button>
   </div>
   <h2 id="skp-mobile-save-title">Сохранить конфигурацию</h2>
   <p id="skp-mobile-save-explainer">Придумайте название сборки, чтобы вернуться к ней позже.</p>
   <div className="skp-mobile-save-summary">
    <div><small>Выбрано компонентов</small><strong>{count}</strong></div>
    <div><small>Общая стоимость</small><strong>{new Intl.NumberFormat('ru-RU').format(total)} ₽</strong></div>
   </div>
   <form onSubmit={submit}>
    <label htmlFor="skp-mobile-save-name">Название сборки</label>
    <input id="skp-mobile-save-name" ref={input} name="name"
     type="text" autoComplete="off" maxLength={60}
     placeholder="Например, мой игровой ПК" value={name} onChange={event=>{setName(event.target.value);setError('')}}/>
    {error&&<p className="skp-mobile-save-error" role="alert">{error}</p>}
    <button type="submit" className="skp-mobile-save-submit" disabled={!count}>
     <Save size={18}/> Сохранить сборку
    </button>
    <button type="button" onClick={onClose} className="skp-mobile-save-cancel">Отмена</button>
   </form>
   <p className="skp-mobile-save-note">Сборка сохранится в браузере этого телефона. Открыть её можно через «Открыть сохранённую».</p>
  </section>
 </div>;
}
