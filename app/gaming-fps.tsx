'use client';
import {useState} from 'react';
import type {FpsHardware,FpsResolution} from '../lib/fps-estimate';
import {estimateFps,resolutions} from '../lib/fps-estimate';

export default function GamingFps({hardware,compact=false}:{hardware:FpsHardware;compact?:boolean}){
 const [resolution,setResolution]=useState<FpsResolution>('FHD');
 const rows=estimateFps(hardware,resolution);
 return <section className={'skp-fps'+(compact?' compact':'')} aria-label="Ориентировочная игровая производительность">
  <div className="skp-fps-heading"><div><span className="eyebrow">SKP / GAME PERFORMANCE</span><h3>Игровая производительность</h3></div>
  <div className="skp-fps-resolutions" role="group" aria-label="Разрешение">
   {resolutions.map(mode=><button type="button" key={mode} aria-pressed={mode===resolution} className={mode===resolution?'current':''} onClick={()=>setResolution(mode)}>{mode}</button>)}
  </div></div>
  {rows?<><div className="skp-fps-hardware"><span>GPU: {hardware.gpu.split(' · ')[0]}</span><span>CPU: {hardware.cpu.split(' · ')[0]}</span></div>
   <div className="skp-fps-list">{rows.map(row=><div className="skp-fps-row" key={row.id}><span>{row.name}</span><strong>{row.low}–{row.high} <small>FPS</small></strong></div>)}</div>
  </>:<p className="skp-fps-empty">Для расчёта сначала укажи поддерживаемую видеокарту NVIDIA RTX или AMD RX и процессор в комплектации.</p>}
  <p className="skp-fps-note">Ориентировочная модельная оценка, а не замеры конкретного ПК. Высокие настройки, без трассировки лучей, DLSS/FSR и генерации кадров; 2K = 2560×1440, 4K = 3840×2160. Реальный FPS зависит от патчей, локации, ОЗУ, охлаждения и настроек; расхождение может быть значительным.</p>
 </section>;
}
