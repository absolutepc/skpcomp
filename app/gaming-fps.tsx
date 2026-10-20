'use client';
import {useEffect,useState} from 'react';
import {Gauge,Info,ScanEye} from 'lucide-react';
import type {FpsHardware,FpsResolution,GraphicsPreset,UpscalingTechnology,UpscalingQuality} from '../lib/fps-estimate';
import {estimateFps,resolutions,graphicsPresets,upscalingQualities,supportsDlss,supportsRayTracing} from '../lib/fps-estimate';

export default function GamingFps({hardware,compact=false}:{hardware:FpsHardware;compact?:boolean}){
 const [resolution,setResolution]=useState<FpsResolution>('FHD');
 const [preset,setPreset]=useState<GraphicsPreset>('high');
 const [rayTracing,setRayTracing]=useState(false);
 const [upscaling,setUpscaling]=useState<UpscalingTechnology>('native');
 const [upscalingQuality,setUpscalingQuality]=useState<UpscalingQuality>('quality');
 const canDlss=supportsDlss(hardware),canRt=supportsRayTracing(hardware);
 // Configurator components can change without remounting the widget.
 useEffect(()=>{if(!canDlss&&upscaling==='dlss')setUpscaling('native')},[canDlss,upscaling]);
 useEffect(()=>{if(!canRt&&rayTracing)setRayTracing(false)},[canRt,rayTracing]);
 const effectiveUpscaling=upscaling==='dlss'&&!canDlss?'native':upscaling;
 const effectiveRt=rayTracing&&canRt;
 const rows=estimateFps(hardware,resolution,{
  preset,rayTracing:effectiveRt,upscaling:effectiveUpscaling,upscalingQuality
 });
 const techLabel=effectiveUpscaling==='dlss'?'DLSS':'FSR';
 return <section className={'skp-fps'+(compact?' compact':'')} aria-label="Ориентировочная игровая производительность">
  <div className="skp-fps-heading"><div><span className="eyebrow">SKP / GAME PERFORMANCE</span><h3><Gauge size={21} aria-hidden="true"/> Игровая производительность</h3></div>
   <div className="skp-fps-resolutions" role="group" aria-label="Разрешение экрана">
    {resolutions.map(mode=><button type="button" key={mode} aria-pressed={mode===resolution} className={mode===resolution?'current':''} onClick={()=>setResolution(mode)}>{mode}</button>)}
   </div>
  </div>
  <div className="skp-fps-settings">
   <div className="skp-fps-setting"><span className="skp-fps-setting-title">Пресет графики</span><div className="skp-fps-choices" role="group" aria-label="Качество графики">
    {graphicsPresets.map(option=><button type="button" key={option.value} aria-pressed={preset===option.value} className={preset===option.value?'current':''} onClick={()=>setPreset(option.value)}>{option.label}</button>)}
   </div></div>
   <div className="skp-fps-setting"><span className="skp-fps-setting-title">Масштабирование</span><div className="skp-fps-choices" role="group" aria-label="Технология масштабирования">
    <button type="button" aria-pressed={effectiveUpscaling==='native'} className={effectiveUpscaling==='native'?'current':''} onClick={()=>setUpscaling('native')}>Нативно</button>
    <button type="button" aria-pressed={effectiveUpscaling==='dlss'} className={effectiveUpscaling==='dlss'?'current':''} disabled={!canDlss} title={!canDlss?'DLSS требует NVIDIA GeForce RTX':undefined} onClick={()=>setUpscaling('dlss')}>DLSS</button>
    <button type="button" aria-pressed={effectiveUpscaling==='fsr'} className={effectiveUpscaling==='fsr'?'current':''} onClick={()=>setUpscaling('fsr')}>FSR</button>
   </div></div>
   <div className="skp-fps-setting"><span className="skp-fps-setting-title">Режим масштабирования</span><div className="skp-fps-choices" role="group" aria-label="Качество масштабирования">
    {upscalingQualities.map(option=><button type="button" key={option.value} aria-pressed={upscalingQuality===option.value} disabled={effectiveUpscaling==='native'} className={upscalingQuality===option.value&&effectiveUpscaling!=='native'?'current':''} onClick={()=>setUpscalingQuality(option.value)}>{option.label}</button>)}
   </div></div>
   <div className="skp-fps-setting skp-fps-rt"><span className="skp-fps-setting-title">Трассировка лучей</span><label className={'skp-fps-rt-toggle'+(effectiveRt?' active':'')}><input type="checkbox" checked={effectiveRt} disabled={!canRt} onChange={event=>setRayTracing(event.target.checked)}/><ScanEye size={16} aria-hidden="true"/> RT {effectiveRt?'включена':'выключена'}</label></div>
  </div>
  {rows?<><div className="skp-fps-hardware"><span>GPU: {hardware.gpu.split(' · ')[0]}</span><span>CPU: {hardware.cpu.split(' · ')[0]}</span></div>
   <div className="skp-fps-list">{rows.map(row=><div className="skp-fps-row" key={row.id}>
    <span className="skp-fps-game"><span>{row.name}</span><span className="skp-fps-game-tags">
    {effectiveRt&&<small className={row.rayTracingApplied?'active':''} title={row.rayTracingApplied?'Эффект RT учтён в оценке':'В данной игре RT не моделируется'}>{row.rayTracingApplied?'RT':'RT —'}</small>}
    {effectiveUpscaling!=='native'&&<small className={row.upscalingApplied?'active':''} title={row.upscalingApplied?'В оценке учтено масштабирование':'Для этой игры режим не моделируется'}>{row.upscalingApplied?techLabel:techLabel+' —'}</small>}
    </span></span>
    <strong>{row.low}–{row.high} <small>FPS</small></strong>
   </div>)}</div>
  </>:<p className="skp-fps-empty">Чтобы рассчитать FPS, укажи в комплектации поддерживаемые процессор и видеокарту NVIDIA GeForce RTX или AMD Radeon RX.</p>}
  <p className="skp-fps-feature-note"><Info size={14} aria-hidden="true"/> RT в модели учитывается только для Cyberpunk 2077 и War Thunder. DLSS/FSR применяются лишь к поддерживаемым играм; знак «—» означает, что эффект не учтён. DLSS доступен только с RTX.</p>
  <p className="skp-fps-note">Это <strong>приблизительная расчётная модель</strong>, а не реальные игровые тесты и не гарантированный диапазон FPS. Пресеты, RT и масштабирование изменяют оценку условно; реализация DLSS/FSR и доступные режимы зависят от игры и версии. Генерация кадров не учитывается. 2K — 2560×1440, 4K — 3840×2160. Фактический FPS может существенно отличаться.</p>
 </section>;
}
