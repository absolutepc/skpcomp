'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ChevronDown,Cpu,HardDrive,Info,MemoryStick,Monitor,Settings2,Video,X} from 'lucide-react';
import type {RefObject} from 'react';
import type {Product} from '../lib/seed';
import type {FpsGameAppearance} from '../lib/fps-game-catalog';
import {getConfiguredFpsGames} from '../lib/fps-game-catalog';
import {getProductImages} from '../lib/product-gallery';
import type {FpsHardware,FpsResolution,GraphicsPreset,UpscalingTechnology,UpscalingQuality} from '../lib/fps-estimate';
import {estimateFps,graphicsPresets,resolutions,upscalingQualities,supportsDlss,supportsRayTracing} from '../lib/fps-estimate';
import './fps-calculator-v2.css';


const screenLabels:Record<FpsResolution,string>={FHD:'1920 × 1080 (Full HD)','2K':'2560 × 1440 (2K)','4K':'3840 × 2160 (4K)'};
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
function GameArtwork({name,image}:{name:string;image:string}){
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[image]);
 return <span className="skp-fps-v2-cover">{!failed&&image?
  <img src={image} alt={name} loading="lazy" onError={()=>setFailed(true)}/>:
  <strong>{name}</strong>}</span>;
}
function StageTitle({number,children,extra}:{number:number;children:React.ReactNode;extra?:React.ReactNode}){
 return <div className="skp-fps-v2-stage-title">
  <span className="skp-fps-v2-stage-number">{number}</span>
  <h3>{children}</h3>{extra&&<div className="skp-fps-v2-stage-extra">{extra}</div>}
 </div>;
}
export default function FpsCalculatorContent({hardware,product,games,onClose,closeButton,titleId}:{
 hardware:FpsHardware;product?:Product;games?:FpsGameAppearance[];onClose:()=>void;
 closeButton:RefObject<HTMLButtonElement|null>;titleId:string;
}){
 const laptop=hardware.platform==='laptop';
 const allGames=getConfiguredFpsGames(games).filter(game=>game.enabled);
 const orderedGames=allGames.length?allGames:getConfiguredFpsGames(undefined).slice(0,1);
 const [gameId,setGameId]=useState<string>(orderedGames[0].id);
 const currentGameId=orderedGames.some(game=>game.id===gameId)?gameId:orderedGames[0].id;
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
 const chosenGame=orderedGames.find(g=>g.id===currentGameId)||orderedGames[0];
 const chosen=calculated?.find(row=>row.id===currentGameId);
 const average=chosen?Math.round((chosen.low+chosen.high)/2):0;
 // Percentile-like indicators are illustrative model estimates, not sampled frame times.
 const oneLow=Math.max(1,Math.round(average*.76));
 const pointOneLow=Math.max(1,Math.round(average*.66));
 const photo=product?getProductImages(product)[0]:undefined;
 const processor=product?.buildComponents?.cpu||product?.specs?.cpu||hardware.cpu||'Не указан';
 const graphics=product?.buildComponents?.gpu||product?.specs?.gpu||hardware.gpu||'Не указана';
 const memory=product?.buildComponents?.ram||(product?.specs?.capacity?product.specs.capacity+' ГБ':'')||hardware.ram||'Не указана';
 const storage=product?.buildComponents?.ssd||product?.specs?.storage||product?.specs?.ssd||'Не указан';
 const gameIndex=orderedGames.findIndex(game=>game.id===currentGameId);
 const changeGame=(direction:-1|1)=>{
  const nextIndex=Math.max(0,Math.min(orderedGames.length-1,gameIndex+direction));
  if(nextIndex!==gameIndex)setGameId(orderedGames[nextIndex].id);
 };
 useEffect(()=>{
  const container=gamesScroller.current;
  const current=container?.querySelector<HTMLButtonElement>('.skp-fps-v2-game-tile.selected');
  if(!container||!current)return;
  const wrap=container.getBoundingClientRect();
  const target=current.getBoundingClientRect();
  const destination=container.scrollLeft+target.left-wrap.left-(wrap.width-target.width)/2;
  container.scrollTo({left:Math.max(0,destination),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 },[currentGameId]);
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
     <button className="skp-fps-v2-carousel-arrow" type="button" onClick={()=>changeGame(-1)} disabled={gameIndex<=0} aria-label="Выбрать предыдущую игру"><ArrowLeft size={21}/></button>
     <div className="skp-fps-v2-games-strip" ref={gamesScroller} role="group" aria-label="Игры для расчёта FPS">
      {orderedGames.map(game=><button type="button" className={'skp-fps-v2-game-tile game-'+game.id+(currentGameId===game.id?' selected':'')} key={game.id}
       aria-pressed={currentGameId===game.id} onClick={()=>setGameId(game.id)}>
       <GameArtwork name={game.name} image={game.image}/>
       <span className="skp-fps-v2-game-name">{game.name}</span>
      </button>)}
     </div>
     <button className="skp-fps-v2-carousel-arrow" type="button" onClick={()=>changeGame(1)} disabled={gameIndex>=orderedGames.length-1} aria-label="Выбрать следующую игру"><ArrowRight size={21}/></button>
    </div>
   </section>
   <section className="skp-fps-v2-stage skp-fps-v2-config">
    <StageTitle number={2}>Настройки</StageTitle>
    <div className="skp-fps-v2-settings-grid">
     <label className="skp-fps-v2-select">Разрешение
      <span className="skp-fps-v2-select-field">
       <Monitor size={20} aria-hidden="true"/>
       <span className="skp-fps-v2-select-value" aria-hidden="true">{screenLabels[resolution]}</span>
       <ChevronDown size={17} aria-hidden="true"/>
       <select aria-label="Разрешение" value={resolution} onChange={event=>setResolution(event.target.value as FpsResolution)}>{resolutions.map(mode=><option key={mode} value={mode}>{screenLabels[mode]}</option>)}</select>
      </span>
     </label>
     <label className="skp-fps-v2-select">Графика
      <span className="skp-fps-v2-select-field">
       <Settings2 size={20} aria-hidden="true"/>
       <span className="skp-fps-v2-select-value" aria-hidden="true">{graphicsPresets.find(option=>option.value===preset)?.label||preset}</span>
       <ChevronDown size={17} aria-hidden="true"/>
       <select aria-label="Графика" value={preset} onChange={event=>setPreset(event.target.value as GraphicsPreset)}>{graphicsPresets.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select>
      </span>
     </label>
     <label className="skp-fps-v2-select">Технология
      <span className="skp-fps-v2-select-field">
       <Cpu size={20} aria-hidden="true"/>
       <span className="skp-fps-v2-select-value" aria-hidden="true">{safeUpscaling==='native'?'Без апскейла':safeUpscaling.toUpperCase()}</span>
       <ChevronDown size={17} aria-hidden="true"/>
       <select aria-label="Технология" value={safeUpscaling} onChange={event=>setUpscaling(event.target.value as UpscalingTechnology)}>
        <option value="native">Без апскейла</option>
        {canDlss&&<option value="dlss">DLSS</option>}
        <option value="fsr">FSR</option>
       </select>
      </span>
     </label>
    </div>
    {(canRt||safeUpscaling!=='native'||laptop)&&<div className="skp-fps-v2-additional">
     <div className="skp-fps-v2-extra-quality">
      {safeUpscaling!=='native'&&<label className="skp-fps-v2-miniselect">Режим {safeUpscaling.toUpperCase()}
       <select value={quality} onChange={event=>setQuality(event.target.value as UpscalingQuality)}>
        {upscalingQualities.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}
       </select>
      </label>}
     </div>
     <div className="skp-fps-v2-extra-ray">
      {canRt&&<button type="button" className="skp-fps-v2-ray" role="switch" aria-checked={enabledRT}
       onClick={()=>setRayTracing(!enabledRT)}>
       <span className="skp-fps-v2-ray-switch" aria-hidden="true"><span/></span>
       <span className="skp-fps-v2-ray-label">Трассировка лучей <small>Если поддерживается игрой</small></span>
      </button>}
     </div>
     <div className="skp-fps-v2-extra-tgp">
      {laptop&&<label className="skp-fps-v2-tgp">Мощность GPU (TGP, Вт)
       <input type="number" min="1" max="250" step="1" placeholder="Укажите TGP" value={tgp} onChange={event=>setTgp(event.target.value)}/>
      </label>}
     </div>
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
