'use client';
import {useState} from 'react';
import type {Product} from '../lib/seed';
import {canonicalBrand} from '../lib/product-brands';
import {cpuPresets,selectedCpuPreset,applyCpuPreset,clearCpuPreset} from '../lib/cpu-presets';
import './admin-gpu-preset.css';

export default function AdminCpuPreset({product,onChange}:{product:Product;onChange:(p:Product)=>void}){
 const brand=canonicalBrand(product.brand),selected=selectedCpuPreset(product);
 const [family,setFamily]=useState(selected?.family||'');
 const [notice,setNotice]=useState('');
 const available=cpuPresets.filter(p=>p.brand===brand);
 const families=[...new Set(available.map(p=>p.family))];
 const selectedId=selected?.family===family?selected.id:'';
 const apply=(id:string)=>{onChange(applyCpuPreset(product,id));setNotice('Характеристики подставлены. Их можно изменить во вкладке «Характеристики». Для записи нажмите «Сохранить».')};
 return <section className="skp-gpu-preset" aria-label="Автозаполнение процессора">
 <h4>Семейство и модель процессора</h4>
 {!available.length?<p>Выберите бренд AMD или Intel, чтобы открыть список процессоров.</p>:<>
 <div className="form-grid">
 <label>Семейство / поколение<select value={family} onChange={e=>{setFamily(e.target.value);setNotice('');if(!e.target.value)onChange(clearCpuPreset(product))}}><option value="">Заполнить вручную</option>{families.map(f=><option key={f}>{f}</option>)}</select></label>
 <label>Модель процессора<select disabled={!family} value={selectedId} onChange={e=>{if(e.target.value)apply(e.target.value);else{onChange(clearCpuPreset(product));setNotice('Ручное заполнение: текущие характеристики сохранены.')}}}><option value="">Выберите модель</option>{available.filter(p=>p.family===family).map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
 </div>
 {selectedId&&<div className="skp-cpu-preset-actions">
  <button className="skp-gpu-preset-apply" type="button" onClick={()=>apply(selectedId)}>Заполнить характеристики повторно</button>
  <a href={selected?.source} target="_blank" rel="noopener noreferrer">Официальные характеристики производителя ↗</a>
 </div>}
 <p>В справочнике {available.length} моделей {brand}: Intel Core i3/i5/i7/i9, Core Ultra 200S и AMD Ryzen 5000/7000/8000/9000. В списке только реальные настольные модели.</p>
 <p>Автозаполнение задаёт сокет, архитектуру, техпроцесс, память, ядра, потоки, базовые и максимальные частоты, кэш L2/L3, PCIe, TDP и графику. У Intel дополнительно задаются P-/E-ядра, их частоты и максимальная мощность Turbo.</p>
 <p>Название, цена, фото, описание и комплектация не меняются. Базовая частота Intel — для P-ядер; общая частота Turbo может отличаться от частоты P-ядер. Точный тип памяти зависит от материнской платы. Вы можете отредактировать значения вручную.</p>
 {family&&!selectedId&&<p>Выберите модель для автозаполнения. Текущие характеристики пока не изменены.</p>}
 </>}
 {notice&&<p className="skp-gpu-preset-notice" role="status">{notice}</p>}
 </section>;
}
