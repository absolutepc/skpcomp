'use client';
import {useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import {ChevronLeft,ChevronRight} from 'lucide-react';
import './configurator-carousel.css';

/** Browsing a card is independent from choosing it for the build. */
export default function ConfiguratorCarousel({cards,names,label,controls}:{cards:ReactNode[];names:string[];label:string;controls:ReactNode}){
 const initial=Math.min(2,Math.max(0,cards.length-1));
 const [active,setActive]=useState(initial);
 const rail=useRef<HTMLDivElement>(null);
 const center=(index:number,animate=true)=>{
  const element=rail.current;
  const card=element?.querySelectorAll<HTMLElement>('.config-slide')[index];
  if(!element||!card)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  element.scrollTo({left:card.offsetLeft-(element.clientWidth-card.offsetWidth)/2,behavior:animate&&!reduced?'smooth':'instant'});
 };
 useLayoutEffect(()=>{center(initial,false);const observer=new ResizeObserver(()=>center(activeRef.current,false));if(rail.current)observer.observe(rail.current);return()=>observer.disconnect()},[]);
 const activeRef=useRef(initial);
 const go=(index:number)=>{const next=Math.max(0,Math.min(cards.length-1,index));activeRef.current=next;setActive(next);center(next)};
 if(!cards.length)return <div className="config-models-title">{controls}</div>;
 return <><section className="config-showcase" aria-label="Карусель комплектующих" aria-roledescription="карусель">
  <div className="config-showcase-rail" ref={rail} onScroll={()=>{
   const element=rail.current;if(!element)return;
   const midpoint=element.scrollLeft+element.clientWidth/2;
   const slides=Array.from(element.querySelectorAll<HTMLElement>('.config-slide'));
   let nearest=0;let distance=Infinity;
   slides.forEach((slide,index)=>{const delta=Math.abs(slide.offsetLeft+slide.offsetWidth/2-midpoint);if(delta<distance){nearest=index;distance=delta}});
   activeRef.current=nearest;setActive(nearest);
  }}>
   {cards.map((card,index)=><div key={index} className={'config-slide'+(active===index?' is-focused':'')} data-side={index<active?'left':'right'} role="group" aria-roledescription="слайд" aria-label={`${index+1} из ${cards.length}: ${names[index]}`} onFocusCapture={()=>{if(index!==active)go(index)}}>{card}</div>)}
  </div>
  <button type="button" className="config-carousel-arrow previous" disabled={active===0} aria-label="Предыдущая модель" onClick={()=>go(active-1)}><ChevronLeft size={25}/></button>
  <button type="button" className="config-carousel-arrow next" disabled={active===cards.length-1} aria-label="Следующая модель" onClick={()=>go(active+1)}><ChevronRight size={25}/></button>
  <div className="config-carousel-caption" aria-live="polite"><span>{names[active]}</span><small>{active+1} / {cards.length}</small></div>
 </section><section className="config-models"><div className="config-models-title"><h2>{label}</h2><span>{cards.length} моделей</span>{controls}</div><div className="config-models-grid">{cards.map((card,index)=><div key={index}>{card}</div>)}</div></section></>;
}
