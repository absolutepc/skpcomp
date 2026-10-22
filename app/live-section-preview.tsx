'use client';
import {useEffect,useRef,type ReactNode,type PointerEvent} from 'react';
import './live-section-preview.css';

export default function LiveSectionPreview({children,href,label,onNavigate}:{children:ReactNode;href:string;label:string;onNavigate:(path:string)=>void}){
 const frame=useRef<HTMLDivElement>(null);
 const viewport=useRef<HTMLDivElement>(null);
 const page=useRef<HTMLDivElement>(null);
 const position=useRef<{x:number;y:number}|null>(null);
 const paint=useRef(()=>{});
 useEffect(()=>{
  const node=frame.current,view=viewport.current,content=page.current;
  if(!node||!view||!content)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine=window.matchMedia('(hover:hover) and (pointer:fine)');
  const update=()=>{
   const animated=!reduced.matches&&fine.matches;
   const scale=view.clientWidth/1100*(animated?1.18:1);
   const horizontal=Math.max(0,1100*scale-view.clientWidth);
   // Reveal the next part of the section without jumping all the way to its footer.
   const vertical=Math.min(Math.max(0,content.scrollHeight*scale-view.clientHeight),view.clientHeight*.9);
   const pointer=animated?position.current:null;
   node.style.setProperty('--preview-scale',String(scale));
   node.style.setProperty('--pan-x',-(pointer?(pointer.x+1)/2:.5)*horizontal+'px');
   node.style.setProperty('--pan-y',-(pointer?(pointer.y+1)/2:0)*vertical+'px');
   node.style.setProperty('--tilt-x',(pointer?pointer.y*4:0)+'deg');
   node.style.setProperty('--tilt-y',(pointer?-pointer.x*5:0)+'deg');
   content.style.minHeight=view.clientHeight/scale+'px';
  };
  paint.current=update;
  const observer=new ResizeObserver(update);
  observer.observe(view);observer.observe(content);
  reduced.addEventListener('change',update);fine.addEventListener('change',update);
  update();
  return()=>{observer.disconnect();reduced.removeEventListener('change',update);fine.removeEventListener('change',update);paint.current=()=>{}};
 },[]);
 const reset=()=>{position.current=null;paint.current()};
 const move=(event:PointerEvent<HTMLDivElement>)=>{
  if(event.pointerType!=='mouse')return;
  const bounds=event.currentTarget.getBoundingClientRect();
  if(!bounds.width||!bounds.height)return;
  position.current={
   x:Math.max(-1,Math.min(1,(event.clientX-bounds.left)/bounds.width*2-1)),
   y:Math.max(-1,Math.min(1,(event.clientY-bounds.top)/bounds.height*2-1))
  };
  paint.current();
 };
 return <div ref={frame} className="skp-live-preview" role="link" tabIndex={0} aria-label={label}
  onClick={()=>onNavigate(href)} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();onNavigate(href)}}}
  onPointerMove={move} onPointerLeave={reset} onPointerCancel={reset} onBlur={reset}>
  <div className="skp-live-screen">
   <div className="skp-live-chrome" aria-hidden="true"><span/><span/><span/><b>SKP / {href==='/pc'?'ГОТОВЫЕ ПК':'КОНФИГУРАТОР'}</b></div>
   <div ref={viewport} className="skp-live-viewport" inert aria-hidden="true">
    <div className="skp-live-motion"><div ref={page} className="skp-live-page">{children}</div></div>
   </div>
  </div>
 </div>;
}
