'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Cpu,ShieldCheck,MessageCircle} from 'lucide-react';
const slides=[
{eyebrow:'НОВИНКА В SKP · LOGITECH G',title:<>LOGITECH G<br/><span>PRO X3</span><br/>SUPERSTRIKE</>,description:<>Logitech G PRO X3 SUPERSTRIKE<br/>в цветах Magenta Eclipse и Midnight Black.</>,primary:'Перейти',href:'/product/logitech-pro-x3-superstrike-black',secondary:'Весь каталог',secondHref:'/catalog/all',image:'/images/skp-new-mice.png',crop:'',label:'Новинка в SKP — Logitech G Pro X3 Superstrike'},
{eyebrow:'КОМПЬЮТЕРЫ. КОМПЛЕКТУЮЩИЕ. ПЕРИФЕРИЯ',title:<>ТВОЙ ИДЕАЛЬНЫЙ<br/><span>КОМПЬЮТЕР</span><br/>НАЧИНАЕТСЯ ЗДЕСЬ</>,description:<>Современные комплектующие, готовые решения<br/>и всё для комфортной игры и работы.</>,primary:'Перейти в каталог',href:'/catalog/all',secondary:'Собрать ПК',secondHref:'/configurator',image:'/images/skp-slide-2.png',crop:'photo',label:'Твой идеальный компьютер'},
{eyebrow:'ASUS ROG · 20TH ANNIVERSARY',title:<>ASUS ROG<br/><span>EDITION 20</span><br/>УЖЕ В SKP</>,description:<>ASUS ROG Azoth Extreme Edition 20 Gaming Keyboard<br/>и ASUS ROG Harpe II Extreme Edition 20 Gaming Mouse уже в SKP.</>,primary:'Смотреть периферию',href:'/catalog/peripherals',secondary:'Весь каталог',secondHref:'/catalog/all',image:'/images/asus-rog-azoth-extreme-edition-20.png',crop:'',label:'ASUS ROG Azoth Extreme Edition 20 и Harpe II Extreme Edition 20 уже в SKP'}
];
export const HERO_AUTOPLAY_MS=5000;
export default function HeroSlider({nav}:{nav:(path:string)=>void}){
 const [index,setIndex]=useState(0);
 const [interactionPaused,setInteractionPaused]=useState(false);
 const [pageHidden,setPageHidden]=useState(false);
 const touch=useRef<number|null>(null);
 const slide=slides[index];
 const move=(direction:number)=>setIndex(i=>(i+direction+slides.length)%slides.length);
 const go=(p:string)=>(e:React.MouseEvent<HTMLAnchorElement>)=>{e.preventDefault();nav(p)};
 // A fresh five-second window starts whenever the user navigates to a slide.
 // Avoid advancing while the user is inspecting controls or the tab is hidden.
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
 },[index,interactionPaused,pageHidden]);
return <section className={"hero hero-carousel"+(index===0?" mouse-launch":index===2?" rog-anniversary":"")} aria-label="Предложения SKP" aria-roledescription="карусель" tabIndex={0} onMouseEnter={()=>setInteractionPaused(true)} onMouseLeave={()=>setInteractionPaused(false)} onFocusCapture={()=>setInteractionPaused(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setInteractionPaused(false)}} onKeyDown={e=>{if(e.key==='ArrowLeft'){e.preventDefault();move(-1)}if(e.key==='ArrowRight'){e.preventDefault();move(1)}}} onTouchStart={e=>{touch.current=e.touches[0].clientX}} onTouchEnd={e=>{if(touch.current!==null){const distance=e.changedTouches[0].clientX-touch.current;if(Math.abs(distance)>55)move(distance<0?1:-1);touch.current=null}}}>
<div className="hero-copy" key={'copy-'+index} role="group" aria-roledescription="слайд" aria-label={`${index+1} из ${slides.length}: ${slide.label}`}><div className="eyebrow">{slide.eyebrow}</div><h1>{slide.title}</h1><p>{slide.description}</p><div className="hero-buttons"><a className="button light" href={slide.href} onClick={go(slide.href)}>{slide.primary}<ArrowRight size={18}/></a><a className="button outline" href={slide.secondHref} onClick={go(slide.secondHref)}>{slide.secondary}</a></div><div className="hero-benefits"><div><Cpu/><span>Подбор<br/>комплектующих</span></div><div><ShieldCheck/><span>Продуманная<br/>сборка</span></div><div><MessageCircle/><span>Помощь<br/>с выбором</span></div></div></div>
<div className="hero-visual" key={'image-'+index}>{index===1?
<div className="second-slide-premium" aria-label="Премиальная сборка игрового компьютера">
  <div className="second-slide-glow" aria-hidden="true"/>
  <div className="second-slide-frame">
    <span className="second-slide-corner second-slide-corner-tl" aria-hidden="true"/>
    <span className="second-slide-corner second-slide-corner-br" aria-hidden="true"/>
    <img className="second-slide-photo" src={slide.image} alt="Игровой компьютер с синей подсветкой и жидкостным охлаждением" onError={e=>{const target=e.currentTarget;if(!target.dataset.fallback){target.dataset.fallback='1';target.src='/images/skp-reference.png';target.classList.add('second-slide-fallback')}}}/>
  </div>
  <div className="second-slide-badge"><span className="second-slide-badge-dot" aria-hidden="true"/> PREMIUM BUILD</div>
  <span className="second-slide-top-note">CUSTOM WATERCOOLING <span aria-hidden="true">/</span> SKP</span>
  <div className="second-slide-chips" aria-label="Особенности сборки">
    <span>RTX GRAPHICS</span><span>LIQUID COOLING</span><span>HIGH-END BUILD</span>
  </div>
</div>:index===2?<div className="rog-duo-showcase" aria-label="Клавиатура и мышь ASUS ROG Edition 20">
  <div className="rog-duo-product rog-duo-keyboard-frame">
    <img className="rog-duo-keyboard" src="/images/asus-rog-azoth-extreme-edition-20.png" alt="ASUS ROG Azoth Extreme Edition 20 Gaming Keyboard" onError={e=>e.currentTarget.parentElement?.classList.add('image-missing')}/>
    <span className="rog-duo-placeholder">ASUS ROG AZOTH EXTREME EDITION 20</span>
    <span className="rog-duo-caption">AZOTH EXTREME · EDITION 20</span>
  </div>
  <div className="rog-duo-product rog-duo-mouse-frame">
    <img className="rog-duo-mouse" src="/images/asus-rog-harpe-ii-extreme-edition-20.png" alt="ASUS ROG Harpe II Extreme Edition 20 Gaming Mouse" onError={e=>e.currentTarget.parentElement?.classList.add('image-missing')}/>
    <span className="rog-duo-placeholder">ASUS ROG HARPE II EXTREME EDITION 20</span>
    <span className="rog-duo-caption">HARPE II EXTREME · EDITION 20</span>
  </div>
</div>:slide.crop?<svg className="reference-art" viewBox={slide.crop} role="img" aria-label={slide.label}><image href={slide.image} width="1024" height="1536"/></svg>:<MouseScene/>}</div><div className="carousel-controls"><div className="carousel-dots" aria-label="Выбор слайда">{slides.map((s,i)=><button key={s.href} className={i===index?'current':''} aria-label={`Показать слайд ${i+1}: ${s.label}`} aria-current={i===index?'true':undefined} onClick={()=>setIndex(i)}><span/></button>)}</div><button className="carousel-arrow" aria-label="Предыдущий слайд" onClick={()=>move(-1)}><ArrowLeft size={19}/></button><button className="carousel-arrow" aria-label="Следующий слайд" onClick={()=>move(1)}><ArrowRight size={19}/></button></div><span className="visually-hidden" role="status" aria-live="polite">Слайд {index+1} из {slides.length}: {slide.label}</span></section>}
function MouseScene(){return <div className="mouse-duo-showcase" role="group" aria-label="Logitech G PRO X3 SUPERSTRIKE — два цвета">
 <div className="mouse-duo-product">
  <svg className="mouse-duo-photo mouse-duo-magenta" viewBox="800 234 900 1692" role="img" aria-label="Logitech G PRO X3 SUPERSTRIKE Magenta Eclipse"><image href="/images/pro-x3-magenta-hd.png" width="2500" height="2160"/></svg>
  <span className="mouse-duo-caption">MAGENTA ECLIPSE</span>
 </div>
 <div className="mouse-duo-product">
  <svg className="mouse-duo-photo mouse-duo-black" viewBox="800 234 900 1692" role="img" aria-label="Logitech G PRO X3 SUPERSTRIKE Midnight Black"><image href="/images/pro-x3-black-hd.png" width="2500" height="2160"/></svg>
  <span className="mouse-duo-caption">MIDNIGHT BLACK</span>
 </div>
</div>}
export function InstagramIcon(){return <svg className="social-brand instagram-brand" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="skp-instagram" x1="0" y1="1" x2="1" y2="0"><stop stopColor="#ffca53"/><stop offset=".35" stopColor="#f44150"/><stop offset=".7" stopColor="#c329a4"/><stop offset="1" stopColor="#6545d0"/></linearGradient></defs><rect width="32" height="32" rx="9" fill="url(#skp-instagram)"/><rect x="7" y="7" width="18" height="18" rx="5.5" fill="none" stroke="white" strokeWidth="2"/><circle cx="16" cy="16" r="4.3" fill="none" stroke="white" strokeWidth="2"/><circle cx="22" cy="10.6" r="1.25" fill="white"/></svg>}
export function WhatsAppIcon(){return <svg className="social-brand whatsapp-brand" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#25d366"/><path d="M7.6 25.2l1.4-5.1a10 10 0 1 1 3.8 4l-5.2 1.1Z" fill="none" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/><path d="M12.4 10.4c-.5-.2-1 .1-1.4.6-.6.7-.8 1.7-.4 2.8 1.2 3.5 3.5 5.8 7 7 .9.3 2 .1 2.7-.4.5-.4.9-1.4.6-1.8l-2.5-1.2c-.4-.2-.6.1-.9.5l-.6.8c-1.8-.7-3.4-2.1-4.2-3.8l.8-1c.2-.3.3-.5.1-.9l-1.2-2.6Z" fill="white"/></svg>}
