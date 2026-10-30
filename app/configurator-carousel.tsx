'use client';
import {useEffect,useLayoutEffect,useRef,useState,type ReactNode,type CSSProperties} from 'react';
import {ChevronLeft,ChevronRight} from 'lucide-react';
import './configurator-carousel.css';
import {carouselPose} from '../lib/carousel-spacing';

/** Native touch swipes remain scrollable. Trackpad gestures move one item at a time,
 * while active-slide perspective is committed only after scrolling has settled:
 * changing every slide's 3D transform on each Safari scroll event caused jitter.
 */
export default function ConfiguratorCarousel({cards,names}:{cards:ReactNode[];names:string[]}){
 const count=cards.length;
 const loop=count>1;
 const initial=loop?count*2:0;
 const [geometry,setGeometry]=useState({width:240,gap:14});
 const [position,setPosition]=useState(initial);
 const positionRef=useRef(initial);
 const nearestRef=useRef(initial);
 const requestedRef=useRef(initial);
 const rail=useRef<HTMLDivElement>(null);
 const settle=useRef<ReturnType<typeof setTimeout>|null>(null);
 const wheelIdle=useRef<ReturnType<typeof setTimeout>|null>(null);
 const wheelLocked=useRef(false);
 const active=count?position%count:0;

 const center=(index:number,animate=true)=>{
  const element=rail.current;
  const card=element?.querySelectorAll<HTMLElement>('.config-slide')[index];
  if(!element||!card)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  element.scrollTo({left:card.offsetLeft-(element.clientWidth-card.offsetWidth)/2,behavior:animate&&!reduced?'smooth':'auto'});
 };
 const settleScroll=()=>{
  const index=nearestRef.current;
  // Loop back to an identical copy without an animated rewind.
  const middle=count*2+((index%count)+count)%count;
  if(loop&&index!==middle){
   rail.current?.classList.add('is-recentering');
   positionRef.current=middle;
   requestedRef.current=middle;
   nearestRef.current=middle;
   setPosition(middle);
   center(middle,false);
   requestAnimationFrame(()=>requestAnimationFrame(()=>rail.current?.classList.remove('is-recentering')));
  }else{
   positionRef.current=index;
   requestedRef.current=index;
   setPosition(index);
  }
 };
 const onScroll=()=>{
  const element=rail.current;
  if(!element)return;
  const midpoint=element.scrollLeft+element.clientWidth/2;
  let nearest=nearestRef.current,distance=Infinity;
  element.querySelectorAll<HTMLElement>('.config-slide').forEach((slide,index)=>{
   const delta=Math.abs(slide.offsetLeft+slide.offsetWidth/2-midpoint);
   if(delta<distance){nearest=index;distance=delta}
  });
  nearestRef.current=nearest;
  if(settle.current)clearTimeout(settle.current);
  settle.current=setTimeout(settleScroll,190);
 };
 const go=(index:number)=>{
  if(settle.current)clearTimeout(settle.current);
  const total=loop?count*5:count;
  const safe=Math.max(0,Math.min(total-1,index));
  requestedRef.current=safe;
  center(safe);
 };

 useLayoutEffect(()=>{
  center(initial,false);
  const measure=()=>{
   const element=rail.current;
   const slide=element?.querySelector<HTMLElement>('.config-slide');
   if(!element||!slide)return;
   setGeometry({width:slide.offsetWidth,gap:parseFloat(getComputedStyle(element).columnGap)||0});
   center(requestedRef.current,false);
  };
  measure();
  const observer=new ResizeObserver(measure);
  if(rail.current)observer.observe(rail.current);
  return()=>{
   observer.disconnect();
   if(settle.current)clearTimeout(settle.current);
   if(wheelIdle.current)clearTimeout(wheelIdle.current);
  };
 },[]);

 useEffect(()=>{
  const element=rail.current;
  if(!element||!loop)return;
  const handleWheel=(event:WheelEvent)=>{
   // Preserve ordinary vertical page scrolling, browser zoom and touch gestures.
   if(event.ctrlKey||Math.abs(event.deltaX)<4||Math.abs(event.deltaX)<=Math.abs(event.deltaY))return;
   event.preventDefault();
   if(wheelIdle.current)clearTimeout(wheelIdle.current);
   wheelIdle.current=setTimeout(()=>{wheelLocked.current=false},240);
   if(wheelLocked.current)return;
   wheelLocked.current=true;
   go(requestedRef.current+(event.deltaX>0?1:-1));
  };
  element.addEventListener('wheel',handleWheel,{passive:false});
  return()=>{
   element.removeEventListener('wheel',handleWheel);
   if(wheelIdle.current)clearTimeout(wheelIdle.current);
   wheelLocked.current=false;
  };
 },[count]);

 if(!count)return null;
 const slides=loop?[...cards,...cards,...cards,...cards,...cards]:cards;
 return <section className="config-showcase" aria-label="Карусель комплектующих" aria-roledescription="карусель">
  <div className="config-showcase-rail" ref={rail} onScroll={onScroll}>
   {slides.map((card,index)=>{
    const offset=index-position;
    const pose=carouselPose(offset,geometry.width,geometry.gap);
    const style={'--slide-scale':pose.scale,'--slide-angle':`${pose.angle}deg`,'--slide-shift':`${pose.shift}px`,zIndex:4-Math.min(Math.abs(offset),3),visibility:Math.abs(offset)>2?'hidden':'visible'} as CSSProperties;
    return <div key={index} style={style} className={'config-slide'+(position===index?' is-focused':'')} inert={Math.abs(offset)>2} role="group" aria-roledescription="слайд" aria-label={`${index%count+1} из ${count}: ${names[index%count]}`} onFocusCapture={()=>{if(index!==position)go(index)}}>{card}</div>;
   })}
  </div>
  <button type="button" className="config-carousel-arrow previous" disabled={!loop} aria-label="Предыдущая модель" onClick={()=>go(requestedRef.current-1)}><ChevronLeft size={25}/></button>
  <button type="button" className="config-carousel-arrow next" disabled={!loop} aria-label="Следующая модель" onClick={()=>go(requestedRef.current+1)}><ChevronRight size={25}/></button>
  <div className="config-carousel-caption" aria-live="polite"><small>{active+1} / {count}</small></div>
 </section>;
}
