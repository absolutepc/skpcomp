'use client';
import {useRef} from 'react';
import type {PointerEvent} from 'react';
import {positionHeroLayer,type HeroLayer} from '../lib/hero-slides';

type PositionFields=Partial<Pick<HeroLayer,'x'|'y'|'captionX'|'captionY'>>;
type Drag={id:string;part:'image'|'caption';startX:number;startY:number;initialX:number;initialY:number;width:number;height:number};
export default function HeroCanvasLayers({layers,editable=false,selectedId,onChange,onSelect}:{
 layers:HeroLayer[];editable?:boolean;selectedId?:string|null;
 onChange?:(id:string,update:PositionFields)=>void;onSelect?:(id:string)=>void;
}){
 const drag=useRef<Drag|null>(null);
 const start=(event:PointerEvent<HTMLDivElement>,layer:HeroLayer,part:Drag['part'])=>{
  if(!editable||!onChange)return;
  const parent=event.currentTarget.closest('.skp-slide-canvas');
  const bounds=parent?.getBoundingClientRect();
  if(!bounds?.width||!bounds.height)return;
  event.preventDefault();event.stopPropagation();onSelect?.(layer.id);
  drag.current={id:layer.id,part,startX:event.clientX,startY:event.clientY,
   initialX:part==='image'?layer.x:layer.captionX,
   initialY:part==='image'?layer.y:layer.captionY,width:bounds.width,height:bounds.height};
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
 return <div className={'skp-slide-canvas'+(editable?' skp-slide-canvas-editable':'')} aria-label="Расположение изображений на слайде">
  {layers.map((layer,i)=><div key={layer.id} className="skp-slide-layer" style={{zIndex:i+1}}>
   <div className={'skp-slide-layer-image'+(selectedId===layer.id?' selected':'')}
    style={{left:layer.x+'%',top:layer.y+'%',width:layer.width+'%',height:layer.height+'%'}}
    onPointerDown={event=>start(event,layer,'image')} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop}
    role={editable?'button':undefined} tabIndex={editable?0:undefined}
    aria-label={editable?'Передвинуть изображение '+(i+1):undefined}
    onKeyDown={event=>{if(!editable||!onChange)return;
     const amount=event.shiftKey?5:1;
     const delta=event.key==='ArrowLeft'?{x:-amount}:event.key==='ArrowRight'?{x:amount}:event.key==='ArrowUp'?{y:-amount}:event.key==='ArrowDown'?{y:amount}:null;
     if(!delta)return;event.preventDefault();onSelect?.(layer.id);
     const next=positionHeroLayer(layer,{x:layer.x+(delta.x||0),y:layer.y+(delta.y||0)});
     onChange(layer.id,{x:next.x,y:next.y});
    }}>
    <img src={layer.image} alt={layer.caption||'Изображение '+(i+1)} draggable={false}/>
   </div>
   {layer.caption&&<div className={'skp-slide-layer-caption'+(selectedId===layer.id?' selected':'')}
    style={{left:layer.captionX+'%',top:layer.captionY+'%'}}
    onPointerDown={event=>start(event,layer,'caption')} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop}
    role={editable?'button':undefined} tabIndex={editable?0:undefined}
    aria-label={editable?'Передвинуть подпись '+(i+1):undefined}
    onKeyDown={event=>{if(!editable||!onChange)return;
     const amount=event.shiftKey?5:1;
     const delta=event.key==='ArrowLeft'?{captionX:-amount}:event.key==='ArrowRight'?{captionX:amount}:event.key==='ArrowUp'?{captionY:-amount}:event.key==='ArrowDown'?{captionY:amount}:null;
     if(!delta)return;event.preventDefault();onSelect?.(layer.id);
     const next=positionHeroLayer(layer,{captionX:layer.captionX+(delta.captionX||0),captionY:layer.captionY+(delta.captionY||0)});
     onChange(layer.id,{captionX:next.captionX,captionY:next.captionY});
    }}>{layer.caption}</div>}
  </div>)}
 </div>;
}
