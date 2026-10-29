'use client';
import {useEffect,useState} from 'react';
import type {Product} from '../lib/seed';
import {canonicalBrand} from '../lib/product-brands';
import {cpuPresets,cpuPresetLine,cpuPresetGeneration,selectedCpuPreset,applyCpuPreset,clearCpuPreset} from '../lib/cpu-presets';
import './admin-gpu-preset.css';

/** Three steps prevent the 12/13/14-gen and 3000–9000 model lists from mixing. */
export default function AdminCpuPreset({product,onChange}:{product:Product;onChange:(p:Product)=>void}){
 const brand=canonicalBrand(product.brand);
 const selected=selectedCpuPreset(product);
 const [line,setLine]=useState(()=>selected?cpuPresetLine(selected):'');
 const [generation,setGeneration]=useState(()=>selected?cpuPresetGeneration(selected):'');
 const [notice,setNotice]=useState('');
 const available=cpuPresets.filter(p=>p.brand===brand);
 const lines=[...new Set(available.map(cpuPresetLine))];
 const currentLine=lines.includes(line)?line:'';
 const lineModels=available.filter(p=>cpuPresetLine(p)===currentLine);
 const generations=[...new Set(lineModels.map(cpuPresetGeneration))];
 const currentGeneration=generations.includes(generation)?generation:'';
 const models=lineModels.filter(p=>cpuPresetGeneration(p)===currentGeneration);
 const selectedId=selected&&cpuPresetLine(selected)===currentLine&&cpuPresetGeneration(selected)===currentGeneration?selected.id:'';

 // A reused editing modal must not retain the previous product's picker state.
 useEffect(()=>{
  const initial=selectedCpuPreset(product);
  setLine(initial?cpuPresetLine(initial):'');
  setGeneration(initial?cpuPresetGeneration(initial):'');
  setNotice('');
 },[product.id,brand]);

 const changeLine=(next:string)=>{
  setLine(next);setGeneration('');setNotice('');
  onChange(clearCpuPreset(product)); // only clears preset metadata, not entered characteristics
 };
 const changeGeneration=(next:string)=>{
  setGeneration(next);setNotice('');
  onChange(clearCpuPreset(product));
 };
 const apply=(id:string)=>{
  onChange(applyCpuPreset(product,id));
  setNotice('Характеристики подставлены. При необходимости исправьте их вручную и нажмите «Сохранить товар».');
 };
 return <section className="skp-gpu-preset" aria-label="Автозаполнение процессора">
  <h4>Выбор процессора — 3 шага</h4>
  {!available.length?<p>Сначала выберите бренд Intel или AMD.</p>:<>
   <div className="skp-cpu-preset-steps">
    <label>1. Линейка
     <select value={currentLine} onChange={e=>changeLine(e.target.value)}>
      <option value="">Выберите линейку</option>
      {lines.map(value=><option value={value} key={value}>{value}</option>)}
     </select>
    </label>
    <label>2. Поколение
     <select value={currentGeneration} disabled={!currentLine} onChange={e=>changeGeneration(e.target.value)}>
      <option value="">Выберите поколение</option>
      {generations.map(value=><option value={value} key={value}>{brand==='Intel'?(value==='Core Ultra 200'?value:value+'-е поколение'):'Ryzen '+value}</option>)}
     </select>
    </label>
    <label>3. Модель
     <select value={selectedId} disabled={!currentGeneration} onChange={e=>{
      if(e.target.value)apply(e.target.value);
      else{onChange(clearCpuPreset(product));setNotice('Ручное заполнение: введённые характеристики сохранены.');}
     }}>
      <option value="">Выберите модель</option>
      {models.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
     </select>
    </label>
   </div>
   {selectedId&&<div className="skp-cpu-preset-actions">
    <button className="skp-gpu-preset-apply" type="button" onClick={()=>apply(selectedId)}>Заполнить повторно</button>
    <a href={selected?.source} target="_blank" rel="noopener noreferrer">Официальные характеристики производителя ↗</a>
   </div>}
   <p>В справочнике {available.length} моделей {brand}. Сначала выберите линейку, затем доступное поколение и точную модель. Несуществующие комбинации не показываются.</p>
   <p>При смене линейки или поколения введённые характеристики не стираются. Новые частоты, ядра, потоки, кэш, сокет, память, PCIe и энергопотребление подставляются только после выбора модели.</p>
   <p>Название, цена, описание, фотографии и комплектация товара остаются прежними. Если нужного процессора нет, характеристики можно заполнить вручную.</p>
   {currentGeneration&&!selectedId&&<p>Выберите модель для автозаполнения. Старые значения пока не заменены.</p>}
  </>}
  {notice&&<p className="skp-gpu-preset-notice" role="status">{notice}</p>}
 </section>;
}
