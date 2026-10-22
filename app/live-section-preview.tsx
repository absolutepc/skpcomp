'use client';
import {useEffect,useRef,type ReactNode,type PointerEvent} from 'react';
import './live-section-preview.css';

/** Renders the real section UI, sharing the shop's data instead of a screenshot. */
export default function LiveSectionPreview({children,href,label,onNavigate}:{children:ReactNode;href:string;label:string;onNavigate:(path:string)=>void}){
 const frame=useRef<HTMLDivElement>(null);
 const screen=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const node=frame.current;
  if(!node)return;
  const resize=()=>node.style.setProperty('--preview-scale',String(node.clientWidth/1100));
  resize();
  const observer=new ResizeObserver(resize);
  observer.observe(node);
  return()=>observer.disconnect();
 },[]);
 const reset=()=>{screen.current?.style.setProperty('--tilt-x','0deg');screen.current?.style.setProperty('--tilt-y','0deg')};
 const move=(event:PointerEvent<HTMLDivElement>)=>{
  if(event.pointerType!=='mouse'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const bounds=event.currentTarget.getBoundingClientRect();
  const x=Math.max(-1,Math.min(1,(event.clientX-bounds.left)/bounds.width*2-1));
  const y=Math.max(-1,Math.min(1,(event.clientY-bounds.top)/bounds.height*2-1));
  screen.current?.style.setProperty('--tilt-x',y*7+'deg');
  screen.current?.style.setProperty('--tilt-y',-x*9+'deg');
 };
 return <div ref={frame} className="skp-live-preview" role="link" tabIndex={0} aria-label={label}
  onClick={()=>onNavigate(href)} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();onNavigate(href)}}}
  onPointerMove={move} onPointerLeave={reset} onPointerCancel={reset} onBlur={reset}>
  <div ref={screen} className="skp-live-screen">
   <div className="skp-live-chrome" aria-hidden="true"><span/><span/><span/><b>SKP / {href==='/pc'?'ГОТОВЫЕ ПК':'КОНФИГУРАТОР'}</b></div>
   <div className="skp-live-viewport" inert aria-hidden="true"><div className="skp-live-page">{children}</div></div>
  </div>
 </div>;
}
