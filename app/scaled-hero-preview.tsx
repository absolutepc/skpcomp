'use client';
import {useEffect,useRef,useState} from 'react';
import {HeroSlidePreview} from './hero-slider';
import type {HeroBreakpoint,HeroPlacement,HeroSlide} from '../lib/hero-slides';

export const HERO_PREVIEW_SIZES={
 desktop:{width:1440,height:560},
 tablet:{width:900,height:500},
 mobile:{width:390,height:665}
} as const;

export default function ScaledHeroPreview({slide,mode,selectedId,onSelect,onPositionChange}:{
 slide:HeroSlide;mode:HeroBreakpoint;selectedId?:string|null;
 onSelect?:(id:string)=>void;onPositionChange?:(id:string,changes:Partial<HeroPlacement>)=>void;
}){
 const holder=useRef<HTMLDivElement>(null);
 const [available,setAvailable]=useState(780);
 useEffect(()=>{
  const node=holder.current;
  if(!node)return;
  const update=()=>setAvailable(node.getBoundingClientRect().width);
  update();
  const observer=new ResizeObserver(update);
  observer.observe(node);
  return()=>observer.disconnect();
 },[]);
 const {width,height}=HERO_PREVIEW_SIZES[mode];
 const scale=Math.min(1,Math.max(.05,available/width));
 return <div className="skp-hero-scaled-preview" ref={holder}>
  <div className="skp-hero-scaled-viewport" style={{width:width*scale,height:height*scale}}>
   <div className="skp-hero-scaled-stage" style={{width,height,transform:'scale('+scale+')'}}>
    <HeroSlidePreview slide={slide} previewMode={mode} selectedId={selectedId}
     onSelect={onSelect} onPositionChange={onPositionChange}/>
   </div>
  </div>
 </div>;
}
