'use client';
import {useRef} from 'react';
import type {CSSProperties,PointerEvent} from 'react';
import {positionHeroLayer,resolveHeroPlacement,type HeroLayer,type HeroBreakpoint,type HeroPlacement} from '../lib/hero-slides';

type PositionFields=Partial<Pick<HeroPlacement,'x'|'y'|'captionX'|'captionY'>>;
type Drag={id:string;part:'image'|'caption';startX:number;startY:number;initialX:number;initialY:number;width:number;height:number};
export default function HeroCanvasLayers({layers,editable=false,selectedId,onChange,onSelect,previewMode='desktop'}:{
 layers:HeroLayer[];editable?:boolean;selectedId?:string|null;previewMode?:HeroBreakpoint;
 onChange?:(id:string,update:PositionFields)=>void;onSelect?:(id:string)=>void;
}){
 const drag=useRef<Drag|null>(null);
 const start=(event:PointerEvent<HTMLDivElement>,layer:HeroLayer,index:number,part:Drag['part'])=>{
  if(!editable||!onChange)return;
  const parent=event.currentTarget.closest('.skp-slide-canvas');
  const bounds=parent?.getBoundingClientRect();
  if(!bounds?.width||!bounds.height)return;
  const placement=resolveHeroPlacement(layer,previewMode,index,layers.length);
  event.preventDefault();event.stopPropagation();onSelect?.(layer.id);
  drag.current={id:layer.id,part,startX:event.clientX,startY:event.clientY,
   initialX:part==='image'?placement.x:placement.captionX,
   initialY:part==='image'?placement.y:placement.captionY,width:bounds.width,height:bounds.height};
  event.currentTarget.setPointerCapture(event.pointerId);
 };
 const move=(event:PointerEvent<HTMLDivElement>)=>{
  const value=drag.current;
  if(!value||!onChange)return;
  const x=value.initialX+(event.clientX-value.startX)/value.width*100;
  const y=value.initialY+(event.clientY-value.startY)/value.height*100;
  const result=positionHeroLayer({
   id:value.id,image:'',caption:'',x:50,y:50,width:30,height:30,captionX:50,captionY:50
  },value.part==='image'?{x,y}:{captionX:x,captionY:y});
  onChange(value.id,value.part==='image'?{x:result.x,y:result.y}:{captionX:result.captionX,captionY:result.captionY});
 };
 const stop=()=>{drag.current=null};
 const styles=(layer:HeroLayer,index:number,kind:'image'|'caption'):CSSProperties=>{
  const place=['desktop','tablet','mobile'].map(mode=>resolveHeroPlacement(layer,mode as HeroBreakpoint,index,layers.length));
  const css:Record<string,string>={};
  for(let i=0;i<3;i++){
   const mode=['desktop','tablet','mobile'][i],v=place[i];
   if(kind==='image'){
    css['--skp-'+mode+'-x']=v.x+'%';css['--skp-'+mode+'-y']=v.y+'%';
    css['--skp-'+mode+'-width']=v.width+'%';css['--skp-'+mode+'-height']=v.height+'%';
   }else{
    css['--skp-'+mode+'-x']=v.captionX+'%';css['--skp-'+mode+'-y']=v.captionY+'%';
   }
  }
  return css as CSSProperties;
 };
 const onKey=(event:React.KeyboardEvent<HTMLDivElement>,layer:HeroLayer,index:number,part:'image'|'caption')=>{
  if(!editable||!onChange)return;
  const amount=event.shiftKey?5:1;
  const dx=event.key==='ArrowLeft'?-amount:event.key==='ArrowRight'?amount:0;
  const dy=event.key==='ArrowUp'?-amount:event.key==='ArrowDown'?amount:0;
  if(!dx&&!dy)return;
  event.preventDefault();onSelect?.(layer.id);
  const current=resolveHeroPlacement(layer,previewMode,index,layers.length);
  const next=positionHeroLayer({...layer,...current},part==='image'?
   {x:current.x+dx,y:current.y+dy}:
   {captionX:current.captionX+dx,captionY:current.captionY+dy});
  onChange(layer.id,part==='image'?{x:next.x,y:next.y}:{captionX:next.captionX,captionY:next.captionY});
 };
 return <div className={'skp-slide-canvas'+(editable?' skp-slide-canvas-editable':'')} aria-label="Расположение изображений на слайде">
  {layers.map((layer,i)=><div key={layer.id} className="skp-slide-layer">
   <div className={'skp-slide-layer-image'+(selectedId===layer.id?' selected':'')}
    style={{...styles(layer,i,'image'),zIndex:i*2+1}}
    onPointerDown={event=>start(event,layer,i,'image')} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop}
    role={editable?'button':undefined} tabIndex={editable?0:undefined}
    aria-label={editable?'Передвинуть изображение '+(i+1):undefined}
    onKeyDown={event=>onKey(event,layer,i,'image')}>
    <img src={layer.image} alt={layer.caption||'Изображение '+(i+1)} draggable={false}/>
   </div>
   {layer.caption&&<div className={'skp-slide-layer-caption'+(selectedId===layer.id?' selected':'')}
    style={{...styles(layer,i,'caption'),zIndex:i*2+2}}
    onPointerDown={event=>start(event,layer,i,'caption')} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop}
    role={editable?'button':undefined} tabIndex={editable?0:undefined}
    aria-label={editable?'Передвинуть подпись '+(i+1):undefined}
    onKeyDown={event=>onKey(event,layer,i,'caption')}>{layer.caption}</div>}
  </div>)}
 </div>;
}
