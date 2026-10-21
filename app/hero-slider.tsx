'use client';
import {Fragment,useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Cpu,ShieldCheck,MessageCircle} from 'lucide-react';
import {defaultHeroSlides,type HeroSlide,type HeroBreakpoint,type HeroPlacement} from '../lib/hero-slides';
import HeroCanvasLayers from './hero-canvas-layers';

export const HERO_AUTOPLAY_MS=5000;
export const isRogOledFeature=(slide:HeroSlide)=>slide.id==='skp-hero-rog-swift-oled-edition-20'||
 /PG27AQWP[\s-]?G/i.test(slide.title+' '+slide.label);


function SlideImage({slide}:{slide:HeroSlide}){
 if(slide.layout==='logitech')return <div className="mouse-duo-showcase" role="group" aria-label={slide.label}>
  <div className="mouse-duo-product">
   <svg className="mouse-duo-photo mouse-duo-magenta" viewBox="800 234 900 1692" role="img" aria-label={slide.caption||'Первое изображение'}><image href={slide.image} width="2500" height="2160"/></svg>
   <span className="mouse-duo-caption">{slide.caption}</span>
  </div>
  <div className="mouse-duo-product">
   <svg className="mouse-duo-photo mouse-duo-black" viewBox="800 234 900 1692" role="img" aria-label={slide.caption2||'Второе изображение'}><image href={slide.image2} width="2500" height="2160"/></svg>
   <span className="mouse-duo-caption">{slide.caption2}</span>
  </div>
 </div>;
 if(slide.layout==='rog')return <div className="rog-duo-showcase" aria-label={slide.label}>
  <div className="rog-duo-product rog-duo-keyboard-frame">
   <img className="rog-duo-keyboard" src={slide.image} alt={slide.caption||slide.label} onError={e=>e.currentTarget.parentElement?.classList.add('image-missing')}/>
   <span className="rog-duo-placeholder">{slide.caption||slide.label}</span>
   <span className="rog-duo-caption">{slide.caption}</span>
  </div>
  <div className="rog-duo-product rog-duo-mouse-frame">
   <img className="rog-duo-mouse" src={slide.image2} alt={slide.caption2||slide.label} onError={e=>e.currentTarget.parentElement?.classList.add('image-missing')}/>
   <span className="rog-duo-placeholder">{slide.caption2||slide.label}</span>
   <span className="rog-duo-caption">{slide.caption2}</span>
  </div>
 </div>;
 if(slide.layout==='premium'){
  const cleanComputer=slide.id==='skp-hero-computer';
  return <div className={'second-slide-premium'+(cleanComputer?' skp-clean-computer-slide':'')} aria-label={slide.label}>
   <div className="second-slide-glow" aria-hidden="true"/>
   <div className="second-slide-frame">
    {!cleanComputer&&<><span className="second-slide-corner second-slide-corner-tl" aria-hidden="true"/>
     <span className="second-slide-corner second-slide-corner-br" aria-hidden="true"/></>}
    <img className="second-slide-photo" src={slide.image} alt={slide.label}
     onError={e=>{const target=e.currentTarget;if(!target.dataset.fallback){
      target.dataset.fallback='1';target.src='/images/skp-reference.png';
      target.classList.add('second-slide-fallback');
     }}}/>
   </div>
   {!cleanComputer&&<>
    <div className="second-slide-badge"><span className="second-slide-badge-dot" aria-hidden="true"/> PREMIUM BUILD</div>
    <span className="second-slide-top-note">CUSTOM WATERCOOLING <span aria-hidden="true">/</span> SKP</span>
    <div className="second-slide-chips" aria-label="Особенности сборки"><span>RTX GRAPHICS</span><span>LIQUID COOLING</span><span>HIGH-END BUILD</span></div>
   </>}
  </div>;
 }
 if(slide.layout==='duo')return <div className="skp-hero-image-duo" aria-label={slide.label}>
  <figure><img src={slide.image} alt={slide.caption||slide.label}/>{slide.caption&&<figcaption>{slide.caption}</figcaption>}</figure>
  <figure><img src={slide.image2} alt={slide.caption2||slide.label}/>{slide.caption2&&<figcaption>{slide.caption2}</figcaption>}</figure>
 </div>;
 return <div className="skp-hero-image-single"><img src={slide.image} alt={slide.label}/>{slide.caption&&<span>{slide.caption}</span>}</div>;
}
export function HeroSlideContent({slide,nav,editable=false,previewMode='desktop',selectedId,onSelect,onPositionChange}:{
 slide:HeroSlide;nav?:(path:string)=>void;editable?:boolean;previewMode?:HeroBreakpoint;
 selectedId?:string|null;onSelect?:(id:string)=>void;
 onPositionChange?:(id:string,changes:Partial<HeroPlacement>)=>void;
}){
 const go=(path:string)=>(event:React.MouseEvent<HTMLAnchorElement>)=>{
  event.preventDefault();nav?.(path);
 };
 return <>
  <div className="hero-copy" key={'copy-'+slide.id} role="group" aria-roledescription="слайд"
   aria-label={slide.label}>
   <div className="eyebrow">{slide.eyebrow}</div>
   <h1>{slide.title.split('\n').map((line,i)=><Fragment key={i}>{i>0&&<br/>}{i===slide.highlightLine?<span>{line}</span>:line}</Fragment>)}</h1>
   <p>{slide.description.split('\n').map((line,i)=><Fragment key={i}>{i>0&&<br/>}{line}</Fragment>)}</p>
   <div className="hero-buttons">
    <a className="button light" href={slide.href} onClick={go(slide.href)}>{slide.primary}<ArrowRight size={18}/></a>
    <a className="button outline" href={slide.secondHref} onClick={go(slide.secondHref)}>{slide.secondary}</a>
   </div>
   <div className="hero-benefits"><div><Cpu/><span>Подбор<br/>комплектующих</span></div><div><ShieldCheck/><span>Продуманная<br/>сборка</span></div><div><MessageCircle/><span>Помощь<br/>с выбором</span></div></div>
  </div>
  {slide.layers?.length?<HeroCanvasLayers layers={slide.layers} previewMode={previewMode} editable={editable} selectedId={selectedId} onSelect={onSelect} onChange={onPositionChange}/>:<div className="hero-visual" key={'image-'+slide.id}><SlideImage slide={slide}/></div>}

 </>;
}
export function HeroSlidePreview({slide,previewMode,selectedId,onSelect,onPositionChange}:{
 slide:HeroSlide;previewMode:HeroBreakpoint;selectedId?:string|null;
 onSelect?:(id:string)=>void;onPositionChange?:(id:string,changes:Partial<HeroPlacement>)=>void;
}){
 return <section className={"hero hero-carousel skp-slide-preview skp-slide-preview-"+previewMode+
 (slide.layout==='logitech'?" mouse-launch":slide.layout==='rog'?" rog-anniversary":"")+
 (isRogOledFeature(slide)?" rog-oled-feature":"")}
 aria-label={"Предпросмотр: "+slide.label}>
  <HeroSlideContent slide={slide} editable previewMode={previewMode} selectedId={selectedId}
   onSelect={onSelect} onPositionChange={onPositionChange}/>
 </section>;
}
export default function HeroSlider({nav,items=defaultHeroSlides}:{nav:(path:string)=>void;items?:HeroSlide[]}){
 const slides=items;
 const [index,setIndex]=useState(0);
 const [interactionPaused,setInteractionPaused]=useState(false);
 const [pageHidden,setPageHidden]=useState(false);
 const touch=useRef<number|null>(null);
 const activeIndex=Math.min(index,Math.max(0,slides.length-1));
 const slide=slides[activeIndex];
 const move=(direction:number)=>setIndex(i=>slides.length?(i+direction+slides.length)%slides.length:0);
 useEffect(()=>{setIndex(i=>i>=slides.length?0:i)},[slides.length]);
 useEffect(()=>{
  const sync=()=>setPageHidden(document.hidden);
  sync();
  document.addEventListener('visibilitychange',sync);
  return()=>document.removeEventListener('visibilitychange',sync);
 },[]);
 useEffect(()=>{
  if(slides.length<2||interactionPaused||pageHidden)return;
  const timeout=window.setTimeout(()=>setIndex(current=>(current+1)%slides.length),HERO_AUTOPLAY_MS);
  return()=>window.clearTimeout(timeout);
 },[index,interactionPaused,pageHidden,slides.length]);
 if(!slide)return null;
 return <section className={"hero hero-carousel"+(slide.layout==='logitech'?" mouse-launch":slide.layout==='rog'?" rog-anniversary":"")+(isRogOledFeature(slide)?" rog-oled-feature":"")}
  aria-label="Предложения SKP" aria-roledescription="карусель" tabIndex={0}
  onMouseEnter={()=>setInteractionPaused(true)} onMouseLeave={()=>setInteractionPaused(false)}
  onFocusCapture={()=>setInteractionPaused(true)}
  onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setInteractionPaused(false)}}
  onKeyDown={e=>{if(e.key==='ArrowLeft'){e.preventDefault();move(-1)}if(e.key==='ArrowRight'){e.preventDefault();move(1)}}}
  onTouchStart={e=>{touch.current=e.touches[0].clientX}}
  onTouchEnd={e=>{if(touch.current!==null){const distance=e.changedTouches[0].clientX-touch.current;if(Math.abs(distance)>55)move(distance<0?1:-1);touch.current=null}}}>
  <HeroSlideContent slide={slide} nav={nav}/>
  {slides.length>1&&<div className="carousel-controls">
   <div className="carousel-dots" aria-label="Выбор слайда">{slides.map((s,i)=><button key={s.id} className={i===activeIndex?'current':''} aria-label={`Показать слайд ${i+1}: ${s.label}`} aria-current={i===activeIndex?'true':undefined} onClick={()=>setIndex(i)}><span/></button>)}</div>
   <button className="carousel-arrow" aria-label="Предыдущий слайд" onClick={()=>move(-1)}><ArrowLeft size={19}/></button>
   <button className="carousel-arrow" aria-label="Следующий слайд" onClick={()=>move(1)}><ArrowRight size={19}/></button>
  </div>}
  <span className="visually-hidden" role="status" aria-live="polite">Слайд {activeIndex+1} из {slides.length}: {slide.label}</span>
 </section>;
}
export function InstagramIcon(){return <svg className="social-brand instagram-brand" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="skp-instagram" x1="0" y1="1" x2="1" y2="0"><stop stopColor="#ffca53"/><stop offset=".35" stopColor="#f44150"/><stop offset=".7" stopColor="#c329a4"/><stop offset="1" stopColor="#6545d0"/></linearGradient></defs><rect width="32" height="32" rx="9" fill="url(#skp-instagram)"/><rect x="7" y="7" width="18" height="18" rx="5.5" fill="none" stroke="white" strokeWidth="2"/><circle cx="16" cy="16" r="4.3" fill="none" stroke="white" strokeWidth="2"/><circle cx="22" cy="10.6" r="1.25" fill="white"/></svg>}
export function WhatsAppIcon(){return <svg className="social-brand whatsapp-brand" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#25d366"/><path d="M7.6 25.2l1.4-5.1a10 10 0 1 1 3.8 4l-5.2 1.1Z" fill="none" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/><path d="M12.4 10.4c-.5-.2-1 .1-1.4.6-.6.7-.8 1.7-.4 2.8 1.2 3.5 3.5 5.8 7 7 .9.3 2 .1 2.7-.4.5-.4.9-1.4.6-1.8l-2.5-1.2c-.4-.2-.6.1-.9.5l-.6.8c-1.8-.7-3.4-2.1-4.2-3.8l.8-1c.2-.3.3-.5.1-.9l-1.2-2.6Z" fill="white"/></svg>}
