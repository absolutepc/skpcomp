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
  {selectedId&&<button type="button" className="skp-gpu-preset-apply" onClick={()=>{
   onChange(applyGpuPreset(product,selectedId));setNotice('Характеристики выбранной модели заполнены повторно. Проверьте питание и сохраните товар.');
  }}>Заполнить характеристики повторно</button>}
  <p>При выборе модели или повторном заполнении заменятся: графический процессор, архитектура, CUDA-ядра, объём и тип памяти, шина, версия и линии PCIe, техпроцесс, базовая частота ядра, RT- и тензорные ядра, TMU, ROP, кэш L2, скорость и пропускная способность памяти, максимальное разрешение, DLSS, рекомендуемый БП и разъём питания.</p>
  <p>Название товара, бренд, серия, фото и цена сохраняются. БП и разъём питания подставляются как базовые значения: у конкретной версии ASUS, MSI и других производителей они могут отличаться. Проверьте их перед сохранением. Boost-частоту, потребление, охлаждение и размеры заполните по конкретной видеокарте. Здесь представлены настольные модели.</p>
  {generation&&!selectedId&&<p>Выберите модель для автозаполнения. Пока текущие характеристики не изменены.</p>}
  {notice&&<p className="skp-gpu-preset-notice" role="status">{notice}</p>}
 </section>;
}
