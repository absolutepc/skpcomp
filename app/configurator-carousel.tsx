'use client';
import {useEffect,useLayoutEffect,useRef,useState,type ReactNode,type CSSProperties,type TouchEvent} from 'react';
import {ChevronLeft,ChevronRight} from 'lucide-react';
import './configurator-carousel.css';
import {carouselPose,carouselVisibleOffsets,carouselWrappedIndex,carouselWheelAxis} from '../lib/carousel-spacing';

/**
 * Gesture-controlled carousel, without native horizontal scrolling.
 * Safari used to scroll five cloned lists while transforms and focus were
 * recalculated on a timer: on a Mac trackpad the two systems could fight,
 * causing oscillations, repeated cards and the wrong position indicator.
 * We now advance once per horizontal gesture and render each visible SKU once.
 */
export default function ConfiguratorCarousel({cards,names}:{cards:ReactNode[];names:string[]}){
 const count=cards.length;
 const [cursor,setCursor]=useState(0);
 const [width,setWidth]=useState(260);
 const rail=useRef<HTMLDivElement>(null);
 const wheelIdle=useRef<ReturnType<typeof setTimeout>|null>(null);
 const wheelAxis=useRef<'horizontal'|'vertical'|null>(null);
 const wheelHandled=useRef(false);
 const touchStart=useRef<{x:number;y:number}|null>(null);
 const active=carouselWrappedIndex(cursor,0,count);
 const canNavigate=count>1;

 const navigate=(direction:number)=>{
  if(!canNavigate)return;
  setCursor(current=>current+direction);
 };

 useLayoutEffect(()=>{
  const element=rail.current;
  if(!element)return;
  const measure=()=>{
   const slide=element.querySelector<HTMLElement>('.config-slide');
   if(!slide)return;
   const next=slide.offsetWidth;
   if(next>0)setWidth(previous=>Math.abs(previous-next)<0.5?previous:next);
  };
  measure();
  const observer=new ResizeObserver(measure);
  observer.observe(element);
  return()=>observer.disconnect();
 },[count]);

 useEffect(()=>{
  const element=rail.current;
  if(!element||!canNavigate)return;
  const handleWheel=(event:WheelEvent)=>{
   // Safari can report some deltaX during an ordinary vertical swipe.
   // Classify once per gesture, then NEVER prevent default for vertical
   // movement (including its diagonal/momentum wheel events).
   if(event.ctrlKey||event.metaKey)return;
   if(wheelIdle.current)clearTimeout(wheelIdle.current);
   wheelIdle.current=setTimeout(()=>{
    wheelAxis.current=null;
    wheelHandled.current=false;
    wheelIdle.current=null;
   },260);
   if(wheelAxis.current===null){
    wheelAxis.current=carouselWheelAxis(event.deltaX,event.deltaY);
   }
   if(wheelAxis.current!=='horizontal')return;
   // Only a clear horizontal gesture belongs to the carousel.
   // It advances once; all further momentum belongs to that same swipe.
   if(event.cancelable)event.preventDefault();
   if(wheelAxis.current==='horizontal'&&!wheelHandled.current){
    wheelHandled.current=true;
    setCursor(current=>current+(event.deltaX>0?1:-1));
   }
  };
  element.addEventListener('wheel',handleWheel,{passive:false});
  return()=>{
   element.removeEventListener('wheel',handleWheel);
   if(wheelIdle.current)clearTimeout(wheelIdle.current);
   wheelIdle.current=null;
   wheelAxis.current=null;
   wheelHandled.current=false;
  };
 },[canNavigate]);

 const onTouchStart=(event:TouchEvent<HTMLDivElement>)=>{
  if(event.touches.length!==1){touchStart.current=null;return}
  const touch=event.touches[0];
  touchStart.current={x:touch.clientX,y:touch.clientY};
 };
 const onTouchEnd=(event:TouchEvent<HTMLDivElement>)=>{
  const start=touchStart.current;
  touchStart.current=null;
  if(!start||!canNavigate||!event.changedTouches.length)return;
  const touch=event.changedTouches[0];
  const dx=touch.clientX-start.x;
  const dy=touch.clientY-start.y;
  if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.3)navigate(dx<0?1:-1);
 };
 if(!count)return null;

 // No duplicate products: for two SKUs we render two cards, not five clones.
 const offsets=carouselVisibleOffsets(count);

 return <section className="config-showcase" aria-label="Карусель комплектующих" aria-roledescription="карусель">
  <div className="config-showcase-rail" ref={rail} tabIndex={0}
   onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onTouchCancel={()=>{touchStart.current=null}}
   onKeyDown={event=>{
    if(event.target!==event.currentTarget)return;
    if(event.key==='ArrowLeft'){event.preventDefault();navigate(-1)}
    else if(event.key==='ArrowRight'){event.preventDefault();navigate(1)}
   }} aria-label="Используйте стрелки или горизонтальный жест для перелистывания">
   {offsets.map(offset=>{
    const virtual=cursor+offset;
    const index=carouselWrappedIndex(cursor,offset,count);
    const pose=carouselPose(offset,width,0);
    const style={
     '--slide-scale':pose.scale,
     '--slide-angle':`${pose.angle}deg`,
     '--slide-shift':`${pose.center}px`,
     zIndex:5-Math.abs(offset)
    } as CSSProperties;
    return <div key={virtual} style={style}
     className={'config-slide'+(offset===0?' is-focused':'')}
     role="group" aria-roledescription="слайд"
     aria-current={offset===0?'true':undefined}
     aria-label={`${index+1} из ${count}: ${names[index]}`}>
     {cards[index]}
    </div>;
   })}
  </div>
  <button type="button" className="config-carousel-arrow previous" disabled={!canNavigate}
   aria-label="Предыдущая модель" onClick={()=>navigate(-1)}><ChevronLeft size={25}/></button>
  <button type="button" className="config-carousel-arrow next" disabled={!canNavigate}
   aria-label="Следующая модель" onClick={()=>navigate(1)}><ChevronRight size={25}/></button>
  <div className="config-carousel-caption" aria-live="polite"><small>{active+1} / {count}</small></div>
 </section>;
}
