'use client';
import {useEffect,useState} from 'react';
import {ChevronDown,Info} from 'lucide-react';
import type {Product} from '../lib/seed';
import {fieldValue} from '../lib/catalog';
import {laptopFieldChoices,laptopFieldGroups} from '../lib/laptop-specs';
import {laptopGraphics,laptopProcessors} from '../lib/laptop-models';
import {applyLaptopCpuPreset,findLaptopCpuPreset} from '../lib/laptop-cpu-presets';
import './admin-laptop-specs.css';

function QuickChoice({label,value,choices,numeric,onChange}:{
 label:string;value:string;choices:readonly string[];numeric?:boolean;onChange:(value:string)=>void;
}){
 const [manual,setManual]=useState(()=>!!value&&!choices.includes(value));
 useEffect(()=>setManual(!!value&&!choices.includes(value)),[label]); // switching product/editor
 const selected=manual||value&&!choices.includes(value)?'custom':value;
 return <label className="skp-laptop-spec-field">{label}
  <select value={selected} onChange={e=>{
   if(e.target.value==='custom')setManual(true);
   else{setManual(false);onChange(e.target.value);}
  }}>
   <option value="">Не указано</option>
   {choices.map(option=><option key={option} value={option}>{option}</option>)}
   <option value="custom">Другое значение…</option>
  </select>
  {(manual||!!value&&!choices.includes(value))&&<input type={numeric?'number':'text'} min={numeric?0:undefined} step={numeric?'any':undefined} maxLength={numeric?undefined:200} value={value} placeholder="Точное значение по спецификации" onChange={e=>onChange(e.target.value)}/>}
 </label>;
}

export default function AdminLaptopSpecs({product,onChange}:{product:Product;onChange:(product:Product)=>void}){
 const currentCpu=fieldValue(product,'cpu');
 const currentGpu=fieldValue(product,'gpu');
 const cpuPreset=laptopProcessors.find(p=>p.name===currentCpu);
 const cpuSpecsPreset=findLaptopCpuPreset(currentCpu);
 const gpuPreset=laptopGraphics.find(p=>p.name===currentGpu);
 const [cpuBrand,setCpuBrand]=useState(cpuPreset?.brand||'');
 const [cpuLine,setCpuLine]=useState(cpuPreset?.line||'');
 const [cpuGeneration,setCpuGeneration]=useState(cpuPreset?.generation||'');
 const [gpuBrand,setGpuBrand]=useState(gpuPreset?.brand||'');
 const [gpuGeneration,setGpuGeneration]=useState(gpuPreset?.generation||'');
 const [customCpu,setCustomCpu]=useState(!!currentCpu&&!cpuPreset);
 const [customGpu,setCustomGpu]=useState(!!currentGpu&&!gpuPreset);
 const [expanded,setExpanded]=useState<string[]>(['Процессор и графика','Экран и изображение']);

 useEffect(()=>{
  const cpu=laptopProcessors.find(p=>p.name===product.specs?.cpu);
  const gpu=laptopGraphics.find(p=>p.name===product.specs?.gpu);
  setCpuBrand(cpu?.brand||'');setCpuLine(cpu?.line||'');setCpuGeneration(cpu?.generation||'');
  setGpuBrand(gpu?.brand||'');setGpuGeneration(gpu?.generation||'');
  setCustomCpu(!!product.specs?.cpu&&!cpu);
  setCustomGpu(!!product.specs?.gpu&&!gpu);
 },[product.id]);

 const change=(key:string,value:string)=>onChange({...product,specs:{...product.specs,[key]:value}});
 const selectCpu=(name:string)=>onChange(applyLaptopCpuPreset(product,name));
 const cpuLines=[...new Set(laptopProcessors.filter(p=>p.brand===cpuBrand).map(p=>p.line))];
 const cpuGenerations=[...new Set(laptopProcessors.filter(p=>p.brand===cpuBrand&&p.line===cpuLine).map(p=>p.generation))];
 const cpus=laptopProcessors.filter(p=>p.brand===cpuBrand&&p.line===cpuLine&&p.generation===cpuGeneration);
 const gpuGenerations=[...new Set(laptopGraphics.filter(p=>p.brand===gpuBrand).map(p=>p.generation))];
 const gpus=laptopGraphics.filter(p=>p.brand===gpuBrand&&p.generation===gpuGeneration);
 const toggle=(title:string)=>setExpanded(values=>values.includes(title)?values.filter(v=>v!==title):[...values,title]);
 return <div className="skp-laptop-editor">
  <div className="skp-laptop-guide"><Info size={17}/><p>При выборе процессора с проверенными характеристиками автоматически заполняются ядра, потоки, Boost, TDP и встроенная графика. Экран, оперативная память, накопители и мощность дискретной видеокарты (TGP) зависят от конкретного ноутбука и не изменяются.</p></div>
  <section className="skp-laptop-model-picker">
   <h4>Процессор — выбор в 4 шага</h4>
   <div className="skp-laptop-picker-steps">
    <label>1. Производитель<select value={cpuBrand} onChange={e=>{setCpuBrand(e.target.value);setCpuLine('');setCpuGeneration('');setCustomCpu(false)}}>
     <option value="">Выбрать</option><option value="AMD">AMD</option><option value="Intel">Intel</option>
    </select></label>
    <label>2. Линейка<select value={cpuLine} disabled={!cpuBrand} onChange={e=>{setCpuLine(e.target.value);setCpuGeneration('');setCustomCpu(false)}}>
     <option value="">Выбрать</option>{cpuLines.map(v=><option key={v} value={v}>{v}</option>)}
    </select></label>
    <label>3. Поколение<select value={cpuGeneration} disabled={!cpuLine} onChange={e=>{setCpuGeneration(e.target.value);setCustomCpu(false)}}>
     <option value="">Выбрать</option>{cpuGenerations.map(v=><option key={v} value={v}>{v}</option>)}
    </select></label>
    <label>4. Точная модель<select value={!customCpu&&cpus.some(v=>v.name===currentCpu)?currentCpu:''} disabled={!cpuGeneration} onChange={e=>{if(e.target.value){selectCpu(e.target.value);setCustomCpu(false)}}}>
     <option value="">Выбрать модель</option>{cpus.map(v=><option key={v.name} value={v.name}>{v.name}</option>)}
    </select></label>
   </div>
   <div className="skp-laptop-current-model"><span>Процессор:</span><strong>{currentCpu||'Не выбран'}</strong>
    <button type="button" onClick={()=>setCustomCpu(v=>!v)}>{customCpu?'Скрыть ввод':'Другая модель'}</button>
   </div>
   {cpuSpecsPreset&&!customCpu&&<div className="skp-laptop-cpu-preset-actions">
    <button className="skp-laptop-preset-apply" type="button" onClick={()=>selectCpu(currentCpu)}>Заполнить характеристики CPU повторно</button>
    <a href={cpuSpecsPreset.source} target="_blank" rel="noopener noreferrer">Характеристики производителя ↗</a>
   </div>}
   {currentCpu&&!cpuSpecsPreset&&!customCpu&&<p className="skp-laptop-cpu-no-data">Для выбранной модели пока нет проверенных параметров. Заполните CPU вручную — значения другого процессора не подставляются.</p>}
   {customCpu&&<label className="skp-laptop-manual-model">Модель процессора, если её нет в списке<input type="text" maxLength={200} value={currentCpu} placeholder="Например, точное название OEM-процессора" onChange={e=>selectCpu(e.target.value)}/></label>}
  </section>
  <section className="skp-laptop-model-picker">
   <h4>Видеокарта — выбор в 3 шага</h4>
   <div className="skp-laptop-picker-steps gpu">
    <label>1. Производитель<select value={gpuBrand} onChange={e=>{setGpuBrand(e.target.value);setGpuGeneration('');setCustomGpu(false)}}>
     <option value="">Выбрать</option>{(['NVIDIA','AMD','Intel'] as const).map(v=><option key={v}>{v}</option>)}
    </select></label>
    <label>2. Поколение<select value={gpuGeneration} disabled={!gpuBrand} onChange={e=>{setGpuGeneration(e.target.value);setCustomGpu(false)}}>
     <option value="">Выбрать</option>{gpuGenerations.map(v=><option key={v} value={v}>{v}</option>)}
    </select></label>
    <label>3. Модель<select value={!customGpu&&gpus.some(v=>v.name===currentGpu)?currentGpu:''} disabled={!gpuGeneration} onChange={e=>{if(e.target.value){change('gpu',e.target.value);setCustomGpu(false)}}}>
     <option value="">Выбрать модель</option>{gpus.map(v=><option key={v.name} value={v.name}>{v.name}</option>)}
    </select></label>
   </div>
   <div className="skp-laptop-current-model"><span>Графика:</span><strong>{currentGpu||'Не выбрана'}</strong>
    <button type="button" onClick={()=>setCustomGpu(v=>!v)}>{customGpu?'Скрыть ввод':'Другая модель'}</button>
   </div>
   {customGpu&&<label className="skp-laptop-manual-model">Точная модель встроенной или дискретной графики<input type="text" maxLength={200} value={currentGpu} onChange={e=>change('gpu',e.target.value)}/></label>}
  </section>
  <p className="skp-laptop-verification">Boost CPU и TDP берутся из спецификаций производителя, если модель есть в справочнике. TDP с диапазоном остаётся диапазоном; реальные лимиты питания и частоты могут зависеть от ноутбука. Видеопамять, TGP с Dynamic Boost, тип экрана, яркость, порты и батарею указывайте по точной модели ноутбука.</p>
  {laptopFieldGroups.map(group=>{
   const fields=group.fields.filter(field=>field.key!=='cpu'&&field.key!=='gpu');
   const filled=fields.filter(field=>fieldValue(product,field.key).trim()).length;
   const open=expanded.includes(group.title);
   return <section className="skp-laptop-spec-section" key={group.title}>
    <button type="button" className="skp-laptop-spec-toggle" onClick={()=>toggle(group.title)} aria-expanded={open}>
     <span><strong>{group.title}</strong><small>{filled} из {fields.length} заполнено</small></span><ChevronDown size={19} className={open?'is-open':''}/>
    </button>
    {open&&<div className="skp-laptop-spec-grid">
     {fields.map(field=>{
      const value=fieldValue(product,field.key);
      const label=field.label+(field.unit?', '+field.unit:'');
      const choices=laptopFieldChoices[field.key];
      if(choices)return <QuickChoice key={product.id+':'+field.key} label={label} value={value} choices={choices} numeric={field.numeric} onChange={v=>change(field.key,v)}/>;
      return <label className="skp-laptop-spec-field" key={field.key}>{label}
       <input type={field.numeric?'number':'text'} min={field.numeric?0:undefined} step={field.numeric?'any':undefined} maxLength={!field.numeric?200:undefined}
        placeholder={field.numeric?'Число без единиц измерения':'Укажите точное значение'} value={value} onChange={e=>change(field.key,e.target.value)}/>
      </label>;
     })}
    </div>}
   </section>;
  })}
 </div>;
}
