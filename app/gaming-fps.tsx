'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {ArrowUpRight,Gauge} from 'lucide-react';
import type {FpsHardware} from '../lib/fps-estimate';
import type {Product} from '../lib/seed';
import type {FpsGameAppearance} from '../lib/fps-game-catalog';
import FpsCalculatorContent from './fps-calculator-content';

const CLOSE_DURATION=240;
export default function GamingFps({hardware,product,games,compact=false,inlineAction=false}:{hardware:FpsHardware;product?:Product;games?:FpsGameAppearance[];compact?:boolean;inlineAction?:boolean}){
 const [open,setOpen]=useState(false);
 const [closing,setClosing]=useState(false);
 const trigger=useRef<HTMLButtonElement|null>(null);
 const panel=useRef<HTMLDivElement|null>(null);
 const closeButton=useRef<HTMLButtonElement|null>(null);
 const closeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const closingRef=useRef(false);
 const titleId=useId();
 const close=()=>{
  if(closingRef.current)return;
  closingRef.current=true;
  setClosing(true);
  closeTimer.current=setTimeout(()=>{
   setOpen(false);
   setClosing(false);
   closingRef.current=false;
   trigger.current?.focus({preventScroll:true});
  },CLOSE_DURATION);
 };
 useEffect(()=>()=>{if(closeTimer.current)clearTimeout(closeTimer.current)},[]);
 useEffect(()=>{
  if(!open)return;
  const body=document.body;
  const saved={
   overflow:body.style.overflow,
   paddingRight:body.style.paddingRight,
   position:body.style.position,
   top:body.style.top,
   left:body.style.left,
   right:body.style.right,
   width:body.style.width
  };
  const scrollX=window.scrollX;
  const scrollY=window.scrollY;
  const isPhone=window.matchMedia('(max-width:760px)').matches;
  if(isPhone){
   // Mobile Safari may keep scrolling behind an overflow:hidden body.
   // Fix the body at its current position and restore that position on close.
   body.style.position='fixed';
   body.style.top=`-${scrollY}px`;
   body.style.left=`-${scrollX}px`;
   body.style.right='0';
   body.style.width='100%';
   body.style.overflow='hidden';
  }else{
   // Removing the viewport scrollbar would make the background page jump.
   // Preserve exactly the space it occupied, including existing body padding.
   const scrollbarWidth=Math.max(0,window.innerWidth-document.documentElement.clientWidth);
   if(scrollbarWidth>0){
    const computedPadding=parseFloat(getComputedStyle(body).paddingRight)||0;
    body.style.paddingRight=`${computedPadding+scrollbarWidth}px`;
   }
   body.style.overflow='hidden';
  }
  // Prevent focus from scrolling the page under the overlay.
  const focusFrame=requestAnimationFrame(()=>closeButton.current?.focus({preventScroll:true}));
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();close();return}
   if(event.key!=='Tab'||!panel.current)return;
   const focusables=Array.from(panel.current.querySelectorAll<HTMLElement>(
    'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
   ));
   if(!focusables.length)return;
   const first=focusables[0],last=focusables[focusables.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  };
  document.addEventListener('keydown',onKey);
  return()=>{
   cancelAnimationFrame(focusFrame);
   document.removeEventListener('keydown',onKey);
   body.style.overflow=saved.overflow;
   body.style.paddingRight=saved.paddingRight;
   body.style.position=saved.position;
   body.style.top=saved.top;
   body.style.left=saved.left;
   body.style.right=saved.right;
   body.style.width=saved.width;
   if(isPhone)window.scrollTo(scrollX,scrollY);
  };
 },[open]);

 return <>
  <button ref={trigger} type="button" aria-haspopup="dialog" aria-expanded={open} aria-label={inlineAction?'Проверить FPS в играх':undefined} title={inlineAction?'FPS в играх':undefined}
   className={inlineAction?'button outline skp-fps-inline-action':'skp-fps-launch'+(compact?' skp-fps-launch-compact':'')} onClick={()=>{if(closeTimer.current)clearTimeout(closeTimer.current);closingRef.current=false;setClosing(false);setOpen(true)}}>
   {inlineAction?<><span className="skp-fps-inline-label">FPS</span><Gauge size={20} aria-hidden="true"/></>:<>
    <span className="skp-fps-launch-icon"><Gauge size={compact?19:25} aria-hidden="true"/></span>
    <span className="skp-fps-launch-text"><strong>{compact?'Игровая производительность':'Проверить FPS в играх'}</strong><small>10 игр · FHD / 2K / 4K · настройки графики</small></span>
    <span className="skp-fps-launch-action">Открыть <ArrowUpRight size={17} aria-hidden="true"/></span>
   </>}
  </button>
  {open&&typeof document!=='undefined'&&createPortal(
   <div className={'skp-fps-overlay'+(closing?' is-closing':'')} onClick={event=>{if(event.target===event.currentTarget)close()}}>
    <div ref={panel} className="skp-fps-modal skp-fps-v2" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
     <FpsCalculatorContent hardware={hardware} product={product} games={games} onClose={close} closeButton={closeButton} titleId={titleId}/>
    </div>
   </div>,document.body
  )}
 </>;
}
