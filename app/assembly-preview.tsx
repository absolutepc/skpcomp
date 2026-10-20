'use client';

import {useEffect,useMemo,useRef,useState} from 'react';
import type {PointerEvent as ReactPointerEvent,WheelEvent as ReactWheelEvent} from 'react';
import {Maximize2,Minus,Plus,RotateCcw,Box,Layers3,Move3D} from 'lucide-react';
import type {Product} from '../lib/seed';

type Point=[number,number,number];
type PartKey='case'|'motherboard'|'cpu'|'ram'|'ssd'|'cooler'|'gpu'|'psu';
type Pose=Record<PartKey,number>;
type Face={points:Point[];fill:string;part:string;alpha:number;stroke:string};
type ProjectedFace={points:string;fill:string;part:string;alpha:number;stroke:string;depth:number};
type PreviewProps={selected:Record<string,string>;products:Product[];activeStep:string;onSelectStep:(key:string)=>void};

const order:PartKey[]=['case','motherboard','cpu','ram','ssd','cooler','gpu','psu'];
const labels:Record<PartKey,string>={case:'Корпус',motherboard:'Материнская плата',cpu:'Процессор',ram:'Оперативная память',ssd:'M.2 SSD',cooler:'Охлаждение',gpu:'Видеокарта',psu:'Блок питания'};
const initialPose=():Pose=>({case:0,motherboard:0,cpu:0,ram:0,ssd:0,cooler:0,gpu:0,psu:0});
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));

/** Technical layout in millimetres. First prototype: generic 440 × 470 × 220 case.
 * ATX board 244 × 305, AM5 CPU 40 × 40, M.2 2280 22 × 80.
 * Not yet a manufacturer's exact CAD model or a mechanical clearance certificate.
 */
function buildMeshes(pose:Pose,selected:PreviewProps['selected'],products:Product[]):Face[]{
  const faces:Face[]=[];
  const find=(key:PartKey)=>products.find(p=>p.id===selected[key]);
  const caseProduct=find('case');
  const chassisColor=/бел|white/i.test((caseProduct?.name||'')+' '+(caseProduct?.specs?.color||''))?'#c4caca':'#5e6968';
  function box(part:string,x:number,y:number,z:number,w:number,h:number,d:number,color:string,alpha=1){
    const t=part in pose?pose[part as PartKey]:1;
    if(t<=.001&&part!=='case-frame')return;
    const k=1-t;
    // Parts arrive from outside the side opening, then settle at their mount positions.
    const offsetY=part==='motherboard'?k*32:k*19;
    const offsetZ=part==='case-frame'?0:k*(part==='motherboard'?160:110);
    const x0=x-w/2,y0=y-h/2+offsetY,z0=z-d/2+offsetZ;
    const x1=x+w/2,y1=y+h/2+offsetY,z1=z+d/2+offsetZ;
    const p:Point[]=[[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]];
    const opacity=alpha*(part==='case-frame'?1:clamp(t*2.4,0,1));
    const variants:[number[],number][]=[
      [[0,1,2,3],-.27],[[4,5,6,7],.09],[[0,4,7,3],-.14],
      [[1,5,6,2],-.32],[[3,2,6,7],.24],[[0,1,5,4],-.42]
    ];
    for(const [indices,delta] of variants){
      faces.push({points:indices.map(i=>p[i]),fill:tint(color,delta),part,alpha:opacity,stroke:part==='case-frame'?'#69746a':'#273632'});
    }
  }
  function flat(part:string,x:number,y:number,z:number,w:number,h:number,fill:string,alpha=1){
    const t=part in pose?pose[part as PartKey]:1;
    if(t<=.001)return;
    const dy=(1-t)*18,dz=(1-t)*110;
    faces.push({points:[[x-w/2,y-h/2+dy,z+dz],[x+w/2,y-h/2+dy,z+dz],[x+w/2,y+h/2+dy,z+dz],[x-w/2,y+h/2+dy,z+dz]],
      fill,part,alpha:alpha*clamp(t*2,0,1),stroke:'#31423a'});
  }
  // Chassis, rear tray, PSU cover and 3 frontal fan housings.
  box('case-frame',220,238,6,420,448,10,'#27302d');
  box('case-frame',220,93,30,412,4,49,'#49564f');
  box('case-frame',220,15,98,412,25,193,chassisColor);
  box('case-frame',220,461,102,430,17,202,chassisColor);
  box('case-frame',12,239,107,17,453,204,chassisColor);
  box('case-frame',430,239,107,17,453,204,chassisColor);
  box('case-frame',220,239,6,424,450,9,'#3b4844');
  box('case-frame',220,82,58,406,102,27,'#29322f');
  box('case-frame',216,131,11,405,4,12,'#79877c');
  for(const y of [169,286,402]){
    box('case-frame',393,y,28,74,79,13,'#202d2c');
    box('case-frame',393,y,38,65,66,10,'#4a5b56');
    box('case-frame',393,y,45,14,60,2,'#22332f');
    box('case-frame',393,y,47,59,12,2,'#22332f');
  }
  box('case-frame',220,235,210,420,8,8,chassisColor,.85);
  box('case-frame',220,31,210,420,9,8,chassisColor);
  box('case-frame',220,442,210,420,9,8,chassisColor);
  box('case-frame',19,235,210,8,420,9,chassisColor,.85);
  box('case-frame',423,235,210,8,420,9,chassisColor,.85);

  if(pose.motherboard>.001){
    box('motherboard',213,280,40,244,305,8,'#153f35');
    box('motherboard',213,280,46,232,293,1.5,'#246154');
    // Heatsinks, power delivery, socket and connectors.
    box('motherboard',152,405,51,104,29,12,'#65736a');
    box('motherboard',112,312,51,22,170,12,'#66776b');
    box('motherboard',181,347,52,62,62,4,'#58635b');
    box('motherboard',181,347,57,51,51,2,'#969d8f');
    box('motherboard',147,205,52,82,25,10,'#6e786f');
    box('motherboard',132,285,53,74,8,7,'#35453f');
    box('motherboard',185,184,51,103,9,6,'#111f1c');
    box('motherboard',255,190,51,43,48,9,'#5d6a64');
    for(const x of [246,260,274,288])box('motherboard',x,356,52,6,116,5,'#172d29');
    for(const y of [154,172])box('motherboard',173,y,51,145,5,5,'#152921');
    for(const [x,y] of [[104,144],[321,144],[104,413],[321,413],[199,144],[199,413]])box('motherboard',x,y,48,4,4,4,'#b9af6b');
    flat('motherboard',208,240,48,155,2,'#376758',.8);
    flat('motherboard',160,260,48,92,2,'#376758',.8);
  }
  if(pose.cpu>.001&&pose.motherboard>.001){
    box('cpu',181,347,60,40,40,6,'#bac9c6');
    box('cpu',181,347,64,27,27,1,'#dbe0d7');
  }
  if(pose.ram>.001&&pose.motherboard>.001){
    for(const x of [251,267]){
      box('ram',x,357,58,7,133,13,'#222a35');
      box('ram',x,357,67,5,115,5,'#83936c');
      for(const y of [316,335,354,373,391])box('ram',x,y,71,5,8,1,'#b7c8a6');
    }
  }
  if(pose.ssd>.001&&pose.motherboard>.001){
    box('ssd',174,253,55,80,22,4,'#26382d');
    box('ssd',174,253,58,57,13,1,'#4a6650');
    box('ssd',207,253,59,7,7,1,'#b8a977');
  }
  if(pose.cooler>.001&&pose.motherboard>.001){
    const cooler=find('cooler');
    const liquid=/жидк|сжо|water|liquid|aio|360|240/i.test((cooler?.name||'')+' '+(cooler?.specs?.coolingType||''));
    if(liquid){
      box('cooler',235,435,95,257,27,34,'#3e4b4e');
      for(const x of [142,235,328])box('cooler',x,435,117,72,21,5,'#718b83');
      box('cooler',181,347,90,66,66,40,'#1d272b');
      box('cooler',181,347,113,41,41,7,'#718a79');
    }else{
      box('cooler',181,347,103,102,117,92,'#8b9790');
      for(const dz of [-28,-16,-4,8,20,32])box('cooler',181,347,103+dz,105,119,3,'#b5bfb9');
      box('cooler',181,347,158,99,111,15,'#222c2d');
      box('cooler',181,347,168,55,59,5,'#61796e');
    }
  }
  if(pose.gpu>.001&&pose.motherboard>.001){
    const gpu=find('gpu');
    const specified=Number(gpu?.specs?.length||0);
    const gpuLength=clamp(Number.isFinite(specified)&&specified>0?specified:265,190,322);
    box('gpu',134+gpuLength/2,217,100,gpuLength,67,86,'#263035');
    box('gpu',134+gpuLength/2,217,147,gpuLength-15,56,12,'#49565a');
    for(const x of [185,265,345].filter(x=>x<134+gpuLength-25)){
      box('gpu',x,217,155,55,48,5,'#1b2226');
      box('gpu',x,217,160,24,25,5,'#79877d');
    }
    box('gpu',132,217,113,11,102,103,'#a5aaa5');
  }
  if(pose.psu>.001){
    box('psu',114,63,114,150,82,139,'#343c41');
    box('psu',114,63,185,112,65,7,'#4d5c5b');
    box('psu',114,63,190,62,43,3,'#728577');
  }
  return faces;
}
function tint(hex:string,delta:number):string{
 const code=hex.replace('#','');
 const nums=[0,2,4].map(i=>parseInt(code.slice(i,i+2),16));
 const vals=nums.map(n=>Math.round(clamp(delta>=0?n+(255-n)*delta:n*(1+delta),0,255)));
 return '#'+vals.map(n=>n.toString(16).padStart(2,'0')).join('');
}
function projection(yaw:number,pitch:number,zoom:number){
 const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
 return (p:Point):[number,number,number]=>{
   const x=p[0]-220,y=p[1]-238,z=p[2]-107;
   const xx=x*cy+z*sy,zz=z*cy-x*sy;
   const yy=y*cp-zz*sp,depth=y*sp+zz*cp;
   const scale=.88*zoom*730/(730-depth);
   return [350+xx*scale,244-yy*scale,depth];
 };
}
export default function AssemblyPreview({selected,products,activeStep,onSelectStep}:PreviewProps){
 const [yaw,setYaw]=useState(-.34),[pitch,setPitch]=useState(.17),[zoom,setZoom]=useState(1);
 const [pose,setPose]=useState<Pose>(initialPose);
 const latest=useRef<Pose>(initialPose());
 const pastIds=useRef<Record<string,string>>({});
 const drag=useRef<{x:number;y:number}|null>(null);
 const signature=order.map(key=>selected[key]||'').join('|');
 useEffect(()=>{
   const from={...latest.current};
   const to=initialPose();
   for(const key of order){
     to[key]=key==='case'?1:Number(Boolean(selected[key]));
     if(selected[key]&&selected[key]!==pastIds.current[key])from[key]=0;
   }
   pastIds.current={...selected};
   const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
   if(reduced){latest.current=to;setPose(to);return;}
   let raf=0;
   const begin=performance.now();
   const step=(now:number)=>{
     const t=clamp((now-begin)/720,0,1);
     const eased=1-Math.pow(1-t,3);
     const next=initialPose();
     for(const key of order)next[key]=from[key]+(to[key]-from[key])*eased;
     latest.current=next;
     setPose(next);
     if(t<1)raf=requestAnimationFrame(step);
   };
   raf=requestAnimationFrame(step);
   return ()=>cancelAnimationFrame(raf);
   // signature tracks both selection and replacement of a model within a step.
 },[signature]);
 const solids=useMemo(()=>{
   const pr=projection(yaw,pitch,zoom);
   return buildMeshes(pose,selected,products).map((face):ProjectedFace=>{
     const pts=face.points.map(pr);
     return {points:pts.map(([x,y])=>x.toFixed(2)+','+y.toFixed(2)).join(' '),
       depth:pts.reduce((n,p)=>n+p[2],0)/pts.length,fill:face.fill,
       part:face.part,alpha:face.alpha,stroke:face.stroke};
   }).sort((a,b)=>a.depth-b.depth);
 },[yaw,pitch,zoom,pose,selected,products]);
 const picked=order.filter(k=>Boolean(selected[k]));
 const displayCount=picked.length;
 const onboard=selected.motherboard;
 const blocking=Boolean((selected.cpu||selected.ram||selected.ssd||selected.gpu||selected.cooler)&&!onboard);
 function beginDrag(e:ReactPointerEvent<SVGSVGElement>){
   drag.current={x:e.clientX,y:e.clientY};
   e.currentTarget.setPointerCapture(e.pointerId);
 }
 function moveDrag(e:ReactPointerEvent<SVGSVGElement>){
   if(!drag.current)return;
   const dx=e.clientX-drag.current.x,dy=e.clientY-drag.current.y;
   drag.current={x:e.clientX,y:e.clientY};
   setYaw(v=>v+dx*.007);
   setPitch(v=>clamp(v-dy*.006,-.8,.85));
 }
 function zoomWheel(e:ReactWheelEvent<SVGSVGElement>){e.preventDefault();setZoom(v=>clamp(v-e.deltaY*.0007,.65,1.55));}
 function changeAngle(direction:number){setYaw(v=>v+direction*.3);}
 return <section className="assembly-preview" aria-label="Интерактивная трёхмерная сборка">
   <div className="assembly-visual">
     <div className="assembly-topline"><span className="assembly-led"/> SKP / 3D ASSEMBLY <span className="assembly-version">TECHNICAL PREVIEW · ATX</span></div>
     <svg className="assembly-svg" viewBox="0 0 700 490" role="img"
        aria-label="Трёхмерная модель компьютерного корпуса и выбранных комплектующих; вращайте мышью или пальцем"
        tabIndex={0} onPointerDown={beginDrag} onPointerMove={moveDrag}
        onPointerUp={()=>{drag.current=null}} onPointerCancel={()=>{drag.current=null}}
        onWheel={zoomWheel}
        onKeyDown={e=>{if(e.key==='ArrowLeft')changeAngle(-1);if(e.key==='ArrowRight')changeAngle(1);if(e.key==='+'||e.key==='=')setZoom(v=>clamp(v+.1,.65,1.55));if(e.key==='-')setZoom(v=>clamp(v-.1,.65,1.55));}}>
       <defs>
         <radialGradient id="assembly-glow"><stop stopColor="#283b27" stopOpacity=".8"/><stop offset="1" stopColor="#0b100d" stopOpacity="0"/></radialGradient>
         <pattern id="assembly-grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" stroke="#4e6250" strokeWidth=".7" fill="none" opacity=".27"/></pattern>
       </defs>
       <rect width="700" height="490" fill="url(#assembly-glow)"/>
       <rect x="25" y="20" width="650" height="448" fill="url(#assembly-grid)" opacity=".5"/>
       <path d="M35 447h630 M65 50h55 M580 50h55" stroke="#556c51" strokeWidth="1" opacity=".4"/>
       {solids.map((face,i)=><polygon key={i} points={face.points} fill={face.fill} fillOpacity={face.alpha}
         stroke={face.part===activeStep?'#b5d67a':face.stroke}
         strokeOpacity={face.part===activeStep?.78:.35} strokeWidth={face.part===activeStep?.95:.5}
         strokeLinejoin="round"/>)}
       <g fill="#7c9480" fontSize="11" letterSpacing="1.5" fontFamily="monospace">
         <text x="27" y="42">X 440 MM</text><text x="27" y="59">Y 470 MM</text>
         <text x="675" y="463" textAnchor="end">Z 220 MM</text>
       </g>
     </svg>
     <div className="assembly-controls" aria-label="Управление просмотром">
       <button type="button" title="Вращение влево" aria-label="Вращать влево" onClick={()=>changeAngle(-1)}><RotateCcw size={16}/></button>
       <button type="button" title="Вращение вправо" aria-label="Вращать вправо" onClick={()=>changeAngle(1)}><RotateCcw size={16} style={{transform:'scaleX(-1)'}}/></button>
       <button type="button" title="Приблизить" aria-label="Приблизить" onClick={()=>setZoom(v=>clamp(v+.13,.65,1.55))}><Plus size={17}/></button>
       <button type="button" title="Отдалить" aria-label="Отдалить" onClick={()=>setZoom(v=>clamp(v-.13,.65,1.55))}><Minus size={17}/></button>
       <button type="button" title="Исходный вид" aria-label="Исходный вид" onClick={()=>{setYaw(-.34);setPitch(.17);setZoom(1)}}><Maximize2 size={17}/></button>
     </div>
     <div className="assembly-hint"><Move3D size={15}/> Перетаскивай для вращения · прокрутка — масштаб</div>
   </div>
   <div className="assembly-sidebar">
     <div className="assembly-side-heading"><div><span className="assembly-kicker">ВИЗУАЛИЗАЦИЯ СБОРКИ</span><h2>Компьютер внутри</h2></div><Box size={25}/></div>
     <p className="assembly-copy">Выбирай комплектующие — они будут устанавливаться на свои места в корпусе. Нажми на этап, чтобы перейти к его выбору.</p>
     <div className="assembly-meter"><span>Установлено деталей</span><strong>{displayCount} / {order.length}</strong></div>
     <div className="assembly-meter-track"><span style={{width:(displayCount/order.length*100)+'%'}}/></div>
     <div className="assembly-part-list">{order.map((key,i)=><button type="button" key={key} className={'assembly-part '+(selected[key]?'installed ':'')+(activeStep===key?'focused':'')} onClick={()=>onSelectStep(key)} title={'Перейти к выбору: '+labels[key]}>
       <span className="assembly-part-num">{String(i+1).padStart(2,'0')}</span>
       <span className="assembly-part-name"><strong>{labels[key]}</strong><small>{selected[key]?products.find(p=>p.id===selected[key])?.name||'Выбрано':'Не выбрано'}</small></span>
       <span className="assembly-part-state">{selected[key]?<Layers3 size={15}/>:<Plus size={15}/>}</span>
     </button>)}</div>
     {blocking&&<p className="assembly-note">Некоторые выбранные детали появятся в 3D после установки материнской платы.</p>}
     <p className="assembly-note">Параметрический прототип: корпус 440 × 470 × 220 мм, ATX-плата 305 × 244 мм. Габариты остальных элементов типовые, а не точные CAD-модели выбранных брендов. Проверку совместимости перед покупкой сохраняем отдельно.</p>
   </div>
 </section>;
}
