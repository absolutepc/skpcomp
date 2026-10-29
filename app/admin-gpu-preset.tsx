'use client';
import {useState} from 'react';
import type {Product} from '../lib/seed';
import {gpuGenerations,gpuPresets,selectedGpuPreset,applyGpuPreset,clearGpuPreset} from '../lib/gpu-presets';
import './admin-gpu-preset.css';

export default function AdminGpuPreset({product,chip,onChange}:{product:Product;chip:string;onChange:(product:Product)=>void}){
 const selected=selectedGpuPreset(product);
 const [generation,setGeneration]=useState(selected?.generation||'');
 const [notice,setNotice]=useState('');
 if(chip!=='NVIDIA')return <div className="skp-gpu-preset"><p>{chip?'Для этого производителя характеристики GPU пока заполняются вручную.':'Выберите производителя GPU, чтобы открыть список поколений и моделей.'}</p></div>;
 const models=gpuPresets.filter(p=>p.generation===generation);
 const selectedId=selected?.generation===generation?selected.id:'';
 return <section className="skp-gpu-preset" aria-label="Автозаполнение видеокарты">
  <h4>Поколение и модель GPU</h4>
  <div className="form-grid">
   <label>Поколение видеокарты<select value={generation} onChange={e=>{setGeneration(e.target.value);setNotice('');if(!e.target.value)onChange(clearGpuPreset(product))}}>
    <option value="">Заполнить вручную</option>{gpuGenerations.map(g=><option key={g.id} value={g.id}>{g.label}</option>)}
   </select></label>
   <label>Модель GPU и память<select disabled={!generation} value={selectedId} onChange={e=>{
    if(!e.target.value){onChange(clearGpuPreset(product));setNotice('Ручное заполнение: текущие характеристики сохранены.');return;}
    onChange(applyGpuPreset(product,e.target.value));setNotice('Общие характеристики GPU подставлены. Их можно изменить во вкладке «Характеристики».');
   }}><option value="">Выберите модель</option>{models.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
  </div>
  <p>При выборе модели заменятся: графический процессор, архитектура, CUDA-ядра, объём и тип памяти, шина, версия PCIe и поддержка трассировки лучей.</p>
  <p>Название товара, бренд, серия, фото и цена сохраняются. Частоты, питание, разъёмы, охлаждение и размеры проверьте по конкретной видеокарте. Здесь представлены настольные модели.</p>
  {generation&&!selectedId&&<p>Выберите модель для автозаполнения. Пока текущие характеристики не изменены.</p>}
  {notice&&<p className="skp-gpu-preset-notice" role="status">{notice}</p>}
 </section>;
}
