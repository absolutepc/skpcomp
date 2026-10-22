'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {ArrowUpRight,Gauge,Info,ScanEye,X} from 'lucide-react';
import type {FpsHardware,FpsResolution,GraphicsPreset,UpscalingTechnology,UpscalingQuality} from '../lib/fps-estimate';
import {estimateFps,prioritizeFpsRows,resolutions,graphicsPresets,upscalingQualities,supportsDlss,supportsRayTracing} from '../lib/fps-estimate';

const CLOSE_DURATION=240;
function AnimatedFpsNumber({value,delay}:{value:number;delay:number}){
 const [current,setCurrent]=useState(0);
 const previous=useRef(0);
 useEffect(()=>{
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
   previous.current=value;setCurrent(value);return;
  }
  const from=previous.current;
  let frame=0;
  const started=performance.now();
  const animate=(now:number)=>{
   const elapsed=now-started-delay;
   if(elapsed<0){frame=requestAnimationFrame(animate);return}
   const progress=Math.min(1,elapsed/760);
   const eased=1-Math.pow(1-progress,3);
   const next=Math.round(from+(value-from)*eased);
   previous.current=next;
   setCurrent(next);
   if(progress<1)frame=requestAnimationFrame(animate);
   else {previous.current=value;setCurrent(value)}
  };
  frame=requestAnimationFrame(animate);
  return()=>cancelAnimationFrame(frame);
 },[value,delay]);
 return <span className="skp-fps-count">{current}</span>;
}

export default function GamingFps({hardware,compact=false,inlineAction=false}:{hardware:FpsHardware;compact?:boolean;inlineAction?:boolean}){
 const [open,setOpen]=useState(false);
 const [laptopPower,setLaptopPower]=useState(hardware.gpuPowerWatts?.toString()||'');
 const mobile=hardware.platform==='laptop';
 const [closing,setClosing]=useState(false);
 const [resolution,setResolution]=useState<FpsResolution>('FHD');
 const [preset,setPreset]=useState<GraphicsPreset>('high');
 const [rayTracing,setRayTracing]=useState(false);
 const [upscaling,setUpscaling]=useState<UpscalingTechnology>('native');
 const [upscalingQuality,setUpscalingQuality]=useState<UpscalingQuality>('quality');
 const trigger=useRef<HTMLButtonElement|null>(null);
 const panel=useRef<HTMLDivElement|null>(null);
 const closeButton=useRef<HTMLButtonElement|null>(null);
 const closeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const titleId=useId();
 const canDlss=supportsDlss(hardware),canRt=supportsRayTracing(hardware);

 // A configurator selection can change while this component remains mounted.
 useEffect(()=>{if(!canDlss&&upscaling==='dlss')setUpscaling('native')},[canDlss,upscaling]);
 useEffect(()=>{if(!canRt&&rayTracing)setRayTracing(false)},[canRt,rayTracing]);

 const close=()=>{
  if(closing)return;
  setClosing(true);
  closeTimer.current=setTimeout(()=>{
   setOpen(false);setClosing(false);trigger.current?.focus();
  },CLOSE_DURATION);
 };
 useEffect(()=>()=>{if(closeTimer.current)clearTimeout(closeTimer.current)},[]);
 useEffect(()=>{
  if(!open)return;
  const before=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const focusFrame=requestAnimationFrame(()=>closeButton.current?.focus());
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();close();return}
   if(event.key!=='Tab'||!panel.current)return;
   const focusables=Array.from(panel.current.querySelectorAll<HTMLElement>(
    'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
   ));
   if(!focusables.length)return;
   const first=focusables[0],last=focusables[focusables.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  };
  document.addEventListener('keydown',onKey);
  return()=>{document.body.style.overflow=before;cancelAnimationFrame(focusFrame);document.removeEventListener('keydown',onKey)};
 },[open,closing]);

 const effectiveUpscaling=upscaling==='dlss'&&!canDlss?'native':upscaling;
 const effectiveRt=rayTracing&&canRt;
 const rows=estimateFps(mobile?{...hardware,gpuPowerWatts:Number(laptopPower)}:hardware,resolution,{
  preset,rayTracing:effectiveRt,upscaling:effectiveUpscaling,upscalingQuality
 });
 const techLabel=effectiveUpscaling==='dlss'?'DLSS':'FSR';
 const displayedRows=rows?prioritizeFpsRows(rows,{rayTracing:effectiveRt,upscaling:effectiveUpscaling}):null;
 const rtAffected=rows?.filter(row=>row.rayTracingApplied).length??0;
 const upscalingAffected=rows?.filter(row=>row.upscalingApplied).length??0;
 return <>
  <button ref={trigger} type="button" aria-haspopup="dialog" aria-expanded={open} aria-label={inlineAction?'Проверить FPS в играх':undefined} title={inlineAction?'FPS в играх':undefined}
   className={inlineAction?'button outline skp-fps-inline-action':'skp-fps-launch'+(compact?' skp-fps-launch-compact':'')} onClick={()=>{if(closeTimer.current)clearTimeout(closeTimer.current);setClosing(false);setOpen(true)}}>
   {inlineAction?<><span className="skp-fps-inline-label">FPS</span><Gauge size={20} aria-hidden="true"/></>:<>
    <span className="skp-fps-launch-icon"><Gauge size={compact?19:25} aria-hidden="true"/></span>
    <span className="skp-fps-launch-text"><strong>{compact?'Игровая производительность':'Проверить FPS в играх'}</strong><small>10 игр · FHD / 2K / 4K · настройки графики</small></span>
    <span className="skp-fps-launch-action">Открыть <ArrowUpRight size={17} aria-hidden="true"/></span>
   </>}
  </button>
  {open&&typeof document!=='undefined'&&createPortal(
   <div className={'skp-fps-overlay'+(closing?' is-closing':'')} onMouseDown={event=>{if(event.target===event.currentTarget)close()}}>
    <div ref={panel} className="skp-fps-modal" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
     <div className="skp-fps-modal-top">
      <div className="skp-fps-modal-title">
       <div><span className="eyebrow">SKP / PERFORMANCE LAB</span><h2 id={titleId}>Игровая производительность</h2><p>Оцени FPS своей конфигурации в популярных играх</p></div>
      </div>
      <button ref={closeButton} type="button" onClick={close} className="skp-fps-modal-close" aria-label="Закрыть FPS-калькулятор"><X size={22}/></button>
     </div>
     <section className="skp-fps" aria-label="Ориентировочная игровая производительность">
      <div className="skp-fps-heading">
       <div><span className="eyebrow">НАСТРОЙКИ ТЕСТИРОВАНИЯ</span><h3>Параметры игры</h3></div>
       <div className="skp-fps-resolutions" role="group" aria-label="Разрешение экрана">
        {resolutions.map(mode=><button type="button" key={mode} aria-pressed={mode===resolution} className={mode===resolution?'current':''} onClick={()=>setResolution(mode)}>{mode}</button>)}
       </div>
      </div>
      {mobile&&<div className="skp-fps-laptop-power">
       <label>Мощность видеокарты ноутбука (TGP, Вт)
        <input type="number" min="1" max="250" step="1" value={laptopPower} placeholder="Укажите по спецификации ноутбука" onChange={event=>setLaptopPower(event.target.value)}/>
       </label>
       <p>Ноутбучные GPU и CPU · работа от сети · режим производительности. Укажите максимальную мощность GPU с Dynamic Boost, если он предусмотрен. Это параметр расчёта, он не меняет настройки устройства.</p>
      </div>}
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
      {rows?<>{(effectiveRt||effectiveUpscaling!=='native')&&<div className="skp-fps-effect-summary" role="status" aria-live="polite">
        {effectiveRt&&<span>RT: <strong>{rtAffected} из {rows.length}</strong> игр</span>}
        {effectiveUpscaling!=='native'&&<span>{techLabel}: <strong>{upscalingAffected} из {rows.length}</strong> игр</span>}
        <small>Игры с активными эффектами показаны первыми</small>
       </div>}<div className="skp-fps-hardware"><span>GPU: {hardware.gpu.split(' · ')[0]}{mobile?' · Laptop GPU · '+laptopPower+' Вт':''}</span><span>CPU: {hardware.cpu.split(' · ')[0]}</span></div>
       <div className="skp-fps-list">{displayedRows!.map((row,index)=><div className="skp-fps-row" key={row.id} style={{animationDelay:index*45+'ms'}}>
        <span className="skp-fps-game"><span>{row.name}</span><span className="skp-fps-game-tags">
         {effectiveRt&&<small className={row.rayTracingApplied?'active':''} title={row.rayTracingApplied?'Эффект RT учтён в оценке':'В данной игре RT не моделируется'}>{row.rayTracingApplied?'RT':'RT —'}</small>}
         {effectiveUpscaling!=='native'&&<small className={row.upscalingApplied?'active':''} title={row.upscalingApplied?'В оценке учтено масштабирование':'Для этой игры режим не моделируется'}>{row.upscalingApplied?techLabel:techLabel+' —'}</small>}
        </span></span>
        <strong aria-label={row.low+'–'+row.high+' FPS'} aria-live="off">
         <AnimatedFpsNumber value={row.low} delay={index*38}/>–<AnimatedFpsNumber value={row.high} delay={index*38+90}/> <small>FPS</small>
        </strong>
       </div>)}</div>
      </>:<p className="skp-fps-empty">{mobile?'Для оценки укажи TGP от 1 до 250 Вт и модели мобильных CPU и GPU в характеристиках ноутбука. Сейчас доступны отдельные расчётные профили RTX 40/50 Laptop; для неподдерживаемых компонентов оценка не выводится.':'Чтобы рассчитать FPS, укажи в комплектации поддерживаемые процессор и видеокарту NVIDIA GeForce RTX или AMD Radeon RX.'}</p>}
      <p className="skp-fps-feature-note"><Info size={14} aria-hidden="true"/> RT в модели учитывается только для Cyberpunk 2077 и War Thunder. DLSS/FSR применяются лишь к поддерживаемым играм; знак «—» означает, что эффект не учтён и FPS для игры не должен измениться. При выборе RT или масштабирования подходящие игры поднимаются в начало списка. DLSS доступен только с RTX.</p>
      {mobile&&<p className="skp-fps-note">Ноутбучные коэффициенты и влияние TGP/ОЗУ являются приближением, а не замерами этой модели. Охлаждение, лимиты CPU, MUX/Optimus и режим питания могут заметно изменить результат. Неизвестный TGP не подменяется настольным значением.</p>}
      <p className="skp-fps-note">Это <strong>приблизительная расчётная модель</strong>, а не реальные игровые тесты и не гарантированный диапазон FPS. Пресеты, RT и масштабирование изменяют оценку условно; реализация DLSS/FSR и доступные режимы зависят от игры и версии. Генерация кадров не учитывается. 2K — 2560×1440, 4K — 3840×2160. Фактический FPS может существенно отличаться.</p>
     </section>
    </div>
   </div>,document.body
  )}
 </>;
}
