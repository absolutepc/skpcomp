'use client';
import {useLayoutEffect,useRef,useState,type ReactNode,type CSSProperties} from 'react';
import {ChevronLeft,ChevronRight} from 'lucide-react';
import './configurator-carousel.css';
import {carouselPose} from '../lib/carousel-spacing';

/** Repeated copies allow native swiping through either end without a visible rewind. */
export default function ConfiguratorCarousel({cards,names,label,controls}:{cards:ReactNode[];names:string[];label:string;controls:ReactNode}){
 const count=cards.length;
 const loop=count>1;
 const initial=loop?count*2:0;
 const [geometry,setGeometry]=useState({width:240,gap:14});
 const [position,setPosition]=useState(initial);
 const positionRef=useRef(initial);
 const rail=useRef<HTMLDivElement>(null);
 const settle=useRef<ReturnType<typeof setTimeout>|null>(null);
 const active=count?position%count:0;
 const center=(index:number,animate=true)=>{
  const element=rail.current;
  const card=element?.querySelectorAll<HTMLElement>('.config-slide')[index];
  if(!element||!card)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  element.scrollTo({left:card.offsetLeft-(element.clientWidth-card.offsetWidth)/2,behavior:animate&&!reduced?'smooth':'instant'});
 };
 const normalize=()=>{
  if(!loop)return;
  const current=positionRef.current;
  const middle=count*2+((current%count)+count)%count;
  if(current===middle)return;
  rail.current?.classList.add('is-recentering');
  positionRef.current=middle;setPosition(middle);center(middle,false);
  requestAnimationFrame(()=>requestAnimationFrame(()=>rail.current?.classList.remove('is-recentering')));
 };
 useLayoutEffect(()=>{
  center(initial,false);
  const measure=()=>{const element=rail.current;const slide=element?.querySelector<HTMLElement>('.config-slide');if(element&&slide)setGeometry({width:slide.offsetWidth,gap:parseFloat(getComputedStyle(element).columnGap)||0});center(positionRef.current,false)};
  measure();
  const observer=new ResizeObserver(measure);
  if(rail.current)observer.observe(rail.current);
  return()=>{observer.disconnect();if(settle.current)clearTimeout(settle.current)};
 },[]);
 const go=(index:number)=>{
  if(settle.current)clearTimeout(settle.current);
  const total=loop?count*5:count;
  let next=index;
  if(next<0||next>=total){normalize();next=positionRef.current+(index<0?-1:1)}
  center(next);
 };
 if(!count)return <div className="config-models-title">{controls}</div>;
 const slides=loop?[...cards,...cards,...cards,...cards,...cards]:cards;
 return <><section className="config-showcase" aria-label="Карусель комплектующих" aria-roledescription="карусель">
  <div className="config-showcase-rail" ref={rail} onScroll={()=>{
   const element=rail.current;if(!element)return;
   const midpoint=element.scrollLeft+element.clientWidth/2;
   let nearest=0;let distance=Infinity;
   element.querySelectorAll<HTMLElement>('.config-slide').forEach((slide,index)=>{const delta=Math.abs(slide.offsetLeft+slide.offsetWidth/2-midpoint);if(delta<distance){nearest=index;distance=delta}});
   positionRef.current=nearest;setPosition(nearest);
   if(settle.current)clearTimeout(settle.current);
   settle.current=setTimeout(normalize,180);
  }}>
   {slides.map((card,index)=>{
    const offset=index-position;
    const pose=carouselPose(offset,geometry.width,geometry.gap);
    const style={'--slide-scale':pose.scale,'--slide-angle':`${pose.angle}deg`,'--slide-shift':`${pose.shift}px`,zIndex:4-Math.min(Math.abs(offset),3),visibility:Math.abs(offset)>3?'hidden':'visible'} as CSSProperties;
    return <div key={index} style={style} className={'config-slide'+(position===index?' is-focused':'')} inert={Math.abs(offset)>3} role="group" aria-roledescription="слайд" aria-label={`${index%count+1} из ${count}: ${names[index%count]}`} onFocusCapture={()=>{if(index!==position)go(index)}}>{card}</div>;
   })}
  </div>
  <button type="button" className="config-carousel-arrow previous" disabled={!loop} aria-label="Предыдущая модель" onClick={()=>go(positionRef.current-1)}><ChevronLeft size={25}/></button>
  <button type="button" className="config-carousel-arrow next" disabled={!loop} aria-label="Следующая модель" onClick={()=>go(positionRef.current+1)}><ChevronRight size={25}/></button>
  <div className="config-carousel-caption" aria-live="polite"><span>{names[active]}</span><small>{active+1} / {count}</small></div>
 </section><section className="config-models"><div className="config-models-title"><h2>{label}</h2><span>{count} моделей</span>{controls}</div><div className="config-models-grid">{cards.map((card,index)=><div key={index}>{card}</div>)}</div></section></>;
}
