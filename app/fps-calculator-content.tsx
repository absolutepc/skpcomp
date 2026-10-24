'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Check,ChevronDown,Cpu,Gamepad2,Gauge,HardDrive,Info,MemoryStick,Monitor,Settings2,Video,X,Zap} from 'lucide-react';
import type {RefObject} from 'react';
import type {Product} from '../lib/seed';
import {getProductImages} from '../lib/product-gallery';
import type {FpsHardware,FpsResolution,GraphicsPreset,UpscalingTechnology,UpscalingQuality} from '../lib/fps-estimate';
import {estimateFps,gameProfiles,graphicsPresets,resolutions,upscalingQualities,supportsDlss,supportsRayTracing} from '../lib/fps-estimate';
import './fps-calculator-v2.css';

const gameOrder=['cs2','valorant','pubg','rust','cyberpunk','bf6','warthunder','squad','dota2','warface'];
const orderedGames=[...gameProfiles].sort((a,b)=>gameOrder.indexOf(a.id)-gameOrder.indexOf(b.id));
const coverText:Record<string,string>={cs2:'CS2',valorant:'VAL',pubg:'PUBG',rust:'RUST',cyberpunk:'2077',bf6:'BF',warthunder:'WT',squad:'SQUAD',dota2:'DOTA',warface:'WF'};
const screenLabels:Record<FpsResolution,string>={FHD:'1920 × 1080 (Full HD)','2K':'2560 × 1440 (2K)','4K':'3840 × 2160 (4K)'};
const money=(n:number)=>new Intl.NumberFormat('ru-RU').format(n);
function AnimatedValue({value,delay=0}:{value:number;delay?:number}){
 const [current,setCurrent]=useState(value);
 const last=useRef(value);
 useEffect(()=>{
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){last.current=value;setCurrent(value);return}
  const from=last.current;
  let frame=0;
  const start=performance.now();
  const animate=(now:number)=>{
   const progress=Math.min(1,Math.max(0,(now-start-delay)/650));
   const shown=Math.round(from+(value-from)*(1-Math.pow(1-progress,3)));
   setCurrent(shown);
   if(progress<1)frame=requestAnimationFrame(animate);else last.current=value;
  };
  frame=requestAnimationFrame(animate);
  return()=>cancelAnimationFrame(frame);
 },[value,delay]);
 return <span className="skp-fps-count">{current}</span>;
}
function StageTitle({number,children,extra}:{number:number;children:React.ReactNode;extra?:React.ReactNode}){
 return <div className="skp-fps-v2-stage-title">
  <span className="skp-fps-v2-stage-number">{number}</span>
  <h3>{children}</h3>{extra&&<div className="skp-fps-v2-stage-extra">{extra}</div>}
 </div>;
}
export default function FpsCalculatorContent({hardware,product,onClose,closeButton,titleId}:{
 hardware:FpsHardware;product?:Product;onClose:()=>void;
 closeButton:RefObject<HTMLButtonElement|null>;titleId:string;
}){
 const laptop=hardware.platform==='laptop';
 const [gameId,setGameId]=useState<string>('cs2');
 const [resolution,setResolution]=useState<FpsResolution>('FHD');
 const [preset,setPreset]=useState<GraphicsPreset>('high');
 const [upscaling,setUpscaling]=useState<UpscalingTechnology>('native');
 const [quality,setQuality]=useState<UpscalingQuality>('quality');
 const [rayTracing,setRayTracing]=useState(false);
 const [tgp,setTgp]=useState(hardware.gpuPowerWatts?.toString()||'');
 const gamesScroller=useRef<HTMLDivElement>(null);
 const canDlss=supportsDlss(hardware),canRt=supportsRayTracing(hardware);
 const safeUpscaling=upscaling==='dlss'&&!canDlss?'native':upscaling;
 const enabledRT=canRt&&rayTracing;
 const calculated=estimateFps(laptop?{...hardware,gpuPowerWatts:Number(tgp)}:hardware,resolution,{
  preset,rayTracing:enabledRT,upscaling:safeUpscaling,upscalingQuality:quality
 });
 const chosenGame=orderedGames.find(g=>g.id===gameId)||orderedGames[0];
 const chosen=calculated?.find(row=>row.id===gameId);
 const average=chosen?Math.round((chosen.low+chosen.high)/2):0;
 // Percentile-like indicators are illustrative model estimates, not sampled frame times.
 const oneLow=Math.max(1,Math.round(average*.76));
 const pointOneLow=Math.max(1,Math.round(average*.66));
 const photo=product?getProductImages(product)[0]:undefined;
 const processor=product?.buildComponents?.cpu||product?.specs?.cpu||hardware.cpu||'Не указан';
 const graphics=product?.buildComponents?.gpu||product?.specs?.gpu||hardware.gpu||'Не указана';
 const memory=product?.buildComponents?.ram||(product?.specs?.capacity?product.specs.capacity+' ГБ':'')||hardware.ram||'Не указана';
 const storage=product?.buildComponents?.ssd||product?.specs?.storage||product?.specs?.ssd||'Не указан';
 const scrollGames=(direction:number)=>{
  gamesScroller.current?.scrollBy({left:direction*260,behavior:'smooth'});
 };
 useEffect(()=>{if(!canDlss&&upscaling==='dlss')setUpscaling('native')},[upscaling,canDlss]);
 useEffect(()=>{if(!canRt&&rayTracing)setRayTracing(false)},[rayTracing,canRt]);
 return <>
  <header className="skp-fps-v2-header">
   <div className="skp-fps-v2-heading"><h2 id={titleId}>FPS-калькулятор</h2>
    <span title="Расчётные данные, не результаты тестирования" className="skp-fps-v2-info"><Info size={17}/></span>
   </div>
   <button ref={closeButton} className="skp-fps-modal-close" aria-label="Закрыть FPS-калькулятор" type="button" onClick={onClose}><X size={22}/></button>
  </header>
  <div className="skp-fps-v2-body">
   <section className="skp-fps-v2-product" aria-label="Проверяемый товар">
    <div className="skp-fps-v2-product-photo">
     {photo?<img src={photo} alt={product?.name||'Изображение товара'}/>:<div className="skp-fps-v2-photo-placeholder"><Monitor size={52}/><span>{laptop?'Ноутбук':'Готовый ПК'}</span></div>}
    </div>
    <div className="skp-fps-v2-product-info">
     <span className="skp-fps-v2-product-type">{laptop?'НОУТБУК':'ГОТОВЫЙ ПК'}</span>
     <h3>{product?.name||(laptop?'Игровой ноутбук':'Игровой компьютер')}</h3>
     <div className="skp-fps-v2-product-specs">
      <div><Cpu size={17}/><span>{processor}</span></div>
      <div><Video size={17}/><span>{graphics}</span></div>
      <div><MemoryStick size={17}/><span>{memory}</span></div>
      <div><HardDrive size={17}/><span>{storage}</span></div>
     </div>
    </div>
   </section>
   <section className="skp-fps-v2-stage skp-fps-v2-games">
    <StageTitle number={1}>Выберите игру</StageTitle>
    <div className="skp-fps-v2-games-navigation">
     <button className="skp-fps-v2-carousel-arrow" type="button" onClick={()=>scrollGames(-1)} aria-label="Предыдущие игры"><ArrowLeft size={21}/></button>
     <div className="skp-fps-v2-games-strip" ref={gamesScroller} role="group" aria-label="Игры для расчёта FPS">
      {orderedGames.map(game=><button type="button" className={'skp-fps-v2-game-tile game-'+game.id+(gameId===game.id?' selected':'')} key={game.id}
       aria-pressed={gameId===game.id} onClick={()=>setGameId(game.id)}>
       <span className="skp-fps-v2-cover"><strong>{coverText[game.id]||game.name.slice(0,4)}</strong></span>
       <span className="skp-fps-v2-game-name">{game.name}</span>
      </button>)}
     </div>
     <button className="skp-fps-v2-carousel-arrow" type="button" onClick={()=>scrollGames(1)} aria-label="Следующие игры"><ArrowRight size={21}/></button>
    </div>
   </section>
   <section className="skp-fps-v2-stage skp-fps-v2-config">
    <StageTitle number={2}>Настройки</StageTitle>
    <div className="skp-fps-v2-settings-grid">
     <label className="skp-fps-v2-select">Разрешение
      <span className="skp-fps-v2-select-field"><Monitor size={20}/><select value={resolution} onChange={event=>setResolution(event.target.value as FpsResolution)}>{resolutions.map(mode=><option key={mode} value={mode}>{screenLabels[mode]}</option>)}</select><ChevronDown size={17}/></span>
     </label>
     <label className="skp-fps-v2-select">Графика
      <span className="skp-fps-v2-select-field"><Settings2 size={20}/><select value={preset} onChange={event=>setPreset(event.target.value as GraphicsPreset)}>{graphicsPresets.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select><ChevronDown size={17}/></span>
     </label>
     <label className="skp-fps-v2-select">Технология
      <span className="skp-fps-v2-select-field"><Cpu size={20}/><select value={safeUpscaling} onChange={event=>setUpscaling(event.target.value as UpscalingTechnology)}>
       <option value="native">Без апскейла</option>
       {canDlss&&<option value="dlss">DLSS</option>}
       <option value="fsr">FSR</option>
      </select><ChevronDown size={17}/></span>
     </label>
    </div>
    {(safeUpscaling!=='native'||canRt||laptop)&&<div className="skp-fps-v2-additional">
     {safeUpscaling!=='native'&&<label className="skp-fps-v2-miniselect">Режим {safeUpscaling.toUpperCase()}
      <select value={quality} onChange={event=>setQuality(event.target.value as UpscalingQuality)}>
       {upscalingQualities.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
     </label>}
     {canRt&&<label className="skp-fps-v2-ray"><input type="checkbox" checked={enabledRT} onChange={event=>setRayTracing(event.target.checked)}/><span>Трассировка лучей (если поддерживается игрой)</span></label>}
     {laptop&&<label className="skp-fps-v2-tgp">Мощность GPU (TGP, Вт)
      <input type="number" min="1" max="250" step="1" placeholder="Укажите TGP" value={tgp} onChange={event=>setTgp(event.target.value)}/>
     </label>}
    </div>}
   </section>
   <section className="skp-fps-v2-stage skp-fps-v2-results">
    <StageTitle number={3}>Результаты <span className="skp-fps-v2-estimated">(приблизительные)</span></StageTitle>
    {chosen?<div className="skp-fps-v2-results-grid">
     <div className="skp-fps-v2-fps-main">
      <span>FPS · {chosenGame.name}</span>
      <strong><AnimatedValue value={average} delay={40}/></strong>
      <small>ориентир: {chosen.low}–{chosen.high} FPS</small>
     </div>
     <div className="skp-fps-v2-metric"><span>1% LOW*</span><strong><AnimatedValue value={oneLow} delay={110}/></strong><div className="skp-fps-v2-meter"><i style={{width:Math.min(100,Math.round(oneLow/Math.max(1,average)*100))+'%'}}/></div></div>
     <div className="skp-fps-v2-metric"><span>AVG</span><strong><AnimatedValue value={average} delay={150}/></strong><div className="skp-fps-v2-meter"><i style={{width:'100%'}}/></div></div>
     <div className="skp-fps-v2-metric warm"><span>0.1% LOW*</span><strong><AnimatedValue value={pointOneLow} delay={190}/></strong><div className="skp-fps-v2-meter"><i style={{width:Math.min(100,Math.round(pointOneLow/Math.max(1,average)*100))+'%'}}/></div></div>
    </div>:<div className="skp-fps-v2-no-result"><Info size={23}/>
     <p>{laptop?'Для расчёта нужны поддерживаемые модели CPU/GPU ноутбука и мощность GPU (TGP) от 1 до 250 Вт.':'Для оценки требуются поддерживаемые процессор и видеокарта в характеристиках выбранного ПК.'}</p>
    </div>}
    <div className="skp-fps-v2-disclaimer"><Info size={17}/>
     <p>Показатели рассчитаны приблизительно, а не измерены на этом устройстве. *1% Low и 0.1% Low — условные оценочные показатели, не реальные замеры кадров. Апскейл и RT учитываются только в поддерживаемых расчётной моделью играх. Фактический FPS зависит от настроек, драйверов и охлаждения{laptop?', TGP и режима питания':''}.</p>
    </div>
   </section>
  </div>
 </>;
}
