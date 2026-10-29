import type {Product} from './seed';

export type BuildSelection=Record<string,string>;
export type BuildIssue={code:string;severity:'error'|'warning';message:string;slots:string[]};
export type PowerRow={label:string;watts:number;estimated:boolean};
export type PowerEstimate={
 rows:PowerRow[];drawWatts:number;recommendedWatts:number;
 supplyWatts:number|null;reserveWatts:number|null;knownLoads:boolean;
 headroomPercent:number;
};
export type BuildAnalysis={issues:BuildIssue[];power:PowerEstimate;checked:number};
const coreSlots=['cpu','motherboard','ram','gpu','ssd','psu','case','cooler'] as const;
const allowedSlots=[...coreSlots,'os','extras'];
const OS_IDS=['windows-10','windows-11'] as const;
const toNum=(v:unknown):number|null=>{
 if(typeof v==='number')return Number.isFinite(v)&&v>0?v:null;
 if(typeof v!=='string')return null;
 const value=v.replace(',','.').match(/\d+(?:\.\d+)?/);
 const number=value?Number(value[0]):NaN;
 return Number.isFinite(number)&&number>0?number:null;
};
const field=(p:Product|undefined,key:string)=>p?.specs?.[key]?.trim() || (key==='socket'?p?.socket:key==='memory'?p?.memory:'')?.trim() || '';
const labels:Record<string,string>={cpu:'Процессор',motherboard:'Материнская плата',ram:'ОЗУ',gpu:'Видеокарта',ssd:'SSD',psu:'Блок питания',case:'Корпус',cooler:'Охлаждение'};
function options(v:string){
 return v.toUpperCase().replace(/MICRO[\s-]?ATX/g,'MATX').replace(/MINI[\s-]?ITX/g,'ITX')
  .split(/[|;,/]+/).map(x=>x.trim()).filter(Boolean);
}
const matching=(a:string,b:string)=>options(a).some(x=>options(b).includes(x));
const memory=(p:Product|undefined)=>field(p,'memory');
export function sanitizeBuildSelection(raw:unknown,products:Product[]):BuildSelection{
 const result:BuildSelection={};
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return result;
 for(const slot of allowedSlots){
  const id=(raw as Record<string,unknown>)[slot];
  if(typeof id!=='string'||id.length>100)continue;
  if(slot==='os'&&OS_IDS.some(option=>option===id)){result.os=id;continue}
  const p=products.find(item=>item.id===id);
  if(p&&(p.category===slot||(slot==='extras'&&p.category==='peripherals')))result[slot]=id;
 }
 return result;
}
export function analyzeBuild(selected:BuildSelection,products:Product[]):BuildAnalysis{
 const items:Record<string,Product|undefined>={};
 for(const key of allowedSlots)items[key]=products.find(p=>p.id===selected[key]&&(p.category===key||(key==='extras'&&p.category==='peripherals')));
 const cpu=items.cpu,board=items.motherboard,ram=items.ram,gpu=items.gpu,psu=items.psu,chassis=items.case,cooler=items.cooler,ssd=items.ssd;
 const issues:BuildIssue[]=[];
 const push=(code:string,severity:BuildIssue['severity'],message:string,...slots:string[])=>issues.push({code,severity,message,slots});
 const cpuSocket=field(cpu,'socket'),boardSocket=field(board,'socket');
 if(cpu&&board&&cpuSocket&&boardSocket&&!matching(cpuSocket,boardSocket))
  push('cpu-socket','error','Сокет процессора ('+cpuSocket+') не подходит к плате ('+boardSocket+').','cpu','motherboard');
 for(const [a,b,slotA,slotB] of [
  [cpu,board,'cpu','motherboard'],[board,ram,'motherboard','ram'],[cpu,ram,'cpu','ram']
 ] as const){
  const am=memory(a),bm=memory(b);
  if(a&&b&&am&&bm&&!matching(am,bm))
   push('ram-'+slotA+'-'+slotB,'error','Несовместимая память: '+am+' и '+bm+'.',slotA,slotB);
 }
 const supported=field(cooler,'socket');
 if(cpu&&cooler&&cpuSocket&&supported&&!matching(cpuSocket,supported))
  push('cooler-socket','error','Кулер не поддерживает сокет '+cpuSocket+'.','cpu','cooler');
 const boardForm=field(board,'form'),caseForm=field(chassis,'boardForm');
 const formMatches=(b:string,c:string)=>{
  const x=options(b)[0],list=options(c);
  if(!x||!list.length)return true;
  if(list.some(z=>z.includes('E-ATX')||z.includes('EATX')))return ['ATX','MATX','ITX','E-ATX','EATX'].includes(x);
  if(list.includes('ATX'))return ['ATX','MATX','ITX'].includes(x);
  if(list.includes('MATX'))return ['MATX','ITX'].includes(x);
  return list.includes(x);
 };
 if(board&&chassis&&boardForm&&caseForm&&!formMatches(boardForm,caseForm))
  push('case-board','error','Форм-фактор '+boardForm+' не подходит к корпусу ('+caseForm+').','motherboard','case');
 const gpuLength=toNum(field(gpu,'length')),maxGpu=toNum(field(chassis,'gpuLength'));
 if(gpu&&chassis&&gpuLength&&maxGpu&&gpuLength>maxGpu)
  push('case-gpu','error','Видеокарта длиной '+gpuLength+' мм не помещается: максимум '+maxGpu+' мм.','gpu','case');
 const coolerHeight=toNum(field(cooler,'height')),maxCooler=toNum(field(chassis,'coolerHeight'));
 if(cooler&&chassis&&coolerHeight&&maxCooler&&coolerHeight>maxCooler)
  push('case-cooler','error','Кулер высотой '+coolerHeight+' мм не помещается: максимум '+maxCooler+' мм.','cooler','case');
 // Case clearances apply in either choice order (case first or component first).
 const gpuSlots=toNum(field(gpu,'slots')),caseGpuSlots=toNum(field(chassis,'gpuThicknessSlots'));
 if(gpu&&chassis&&gpuSlots&&caseGpuSlots&&gpuSlots>caseGpuSlots)
  push('case-gpu-slots','error','Видеокарта занимает '+gpuSlots+' слота, корпус допускает '+caseGpuSlots+'.','gpu','case');
 const psuLength=toNum(field(psu,'length')),casePsuLength=toNum(field(chassis,'psuLength'));
 if(psu&&chassis&&psuLength&&casePsuLength&&psuLength>casePsuLength)
  push('case-psu-length','error','БП длиной '+psuLength+' мм не помещается в корпус (максимум '+casePsuLength+' мм).','psu','case');
 const psuForm=field(psu,'form'),casePsuForm=field(chassis,'psuForm');
 if(psu&&chassis&&psuForm&&casePsuForm&&!matching(psuForm,casePsuForm))
  push('case-psu-form','error','Форм-фактор БП '+psuForm+' не поддерживается корпусом ('+casePsuForm+').','psu','case');
 const coolerRadiator=toNum(field(cooler,'radiator'));
 const radiatorSlots=['frontRadiator','topRadiator','rearRadiator','bottomRadiator','sideRadiator'];
 const knownRadiatorMounts=radiatorSlots.map(slot=>field(chassis,slot)).filter(Boolean);
 // Only restrict radiator selection if the case has published radiator support data.
 if(cooler&&chassis&&coolerRadiator&&knownRadiatorMounts.length){
  const supportedRads=knownRadiatorMounts.flatMap(value=>
   [...value.matchAll(/\b(?:120|140|240|280|360|420|480)\b/g)].map(match=>Number(match[0])));
  if(!supportedRads.includes(coolerRadiator))
   push('case-radiator','error','Радиатор '+coolerRadiator+' мм не указан среди поддерживаемых корпусом размеров.','cooler','case');
 }
 const modules=toNum(field(ram,'modules')),slots=toNum(field(board,'ramSlots'));
 if(ram&&board&&modules&&slots&&modules>slots)
  push('ram-slots','error','Модулей памяти ('+modules+') больше, чем слотов на плате ('+slots+').','ram','motherboard');
 const capacity=toNum(field(ram,'capacity')),maxRam=toNum(field(board,'maxRam'));
 if(ram&&board&&capacity&&maxRam&&capacity>maxRam)
  push('ram-capacity','error','Объём памяти '+capacity+' ГБ превышает лимит платы '+maxRam+' ГБ.','ram','motherboard');
 const m2=toNum(field(board,'m2Slots'));
 if(ssd&&board&&/\bM\.?2\b|NVME/i.test(field(ssd,'form')+' '+field(ssd,'interface'))&&m2===null)
  push('m2-unknown','warning','Число разъёмов M.2 не указано — уточните поддержку SSD.','ssd','motherboard');
 if(ssd&&board&&/\bM\.?2\b|NVME/i.test(field(ssd,'form')+' '+field(ssd,'interface'))&&m2!==null&&m2<1)
  push('m2-slots','error','На материнской плате нет разъёма M.2 для выбранного SSD.','ssd','motherboard');
 const cpuLoad=toNum(cpu?.specs?.watts)??toNum(cpu?.watts);
 const gpuLoad=toNum(gpu?.specs?.watts)??toNum(gpu?.watts);
 const ramPower=(toNum(field(ram,'modules'))??(ram?2:0))*4;
 const fanCount=toNum(field(chassis,'fans'))??(chassis?2:0);
 const rows:PowerRow[]=[
  {label:'Плата и базовая система',watts:45,estimated:true},
  ...(cpu?[{label:labels.cpu,watts:cpuLoad??0,estimated:cpuLoad===null}]:[]),
  ...(gpu?[{label:labels.gpu,watts:gpuLoad??0,estimated:gpuLoad===null}]:[]),
  ...(ram?[{label:'Оперативная память',watts:ramPower,estimated:true}]:[]),
  ...(ssd?[{label:'SSD',watts:toNum(ssd.specs?.watts)??8,estimated:true}]:[]),
  ...(cooler?[{label:'Охлаждение',watts:toNum(cooler.specs?.power)??7,estimated:true}]:[]),
  ...(chassis?[{label:'Корпусные вентиляторы',watts:Math.round(fanCount*4),estimated:true}]:[]),
  {label:'USB и периферия',watts:15,estimated:true}
 ];
 const drawWatts=rows.reduce((sum,row)=>sum+row.watts,0);
 const knownLoads=Boolean(cpu&&gpu&&cpuLoad&&gpuLoad);
 const recommendedWatts=Math.ceil(drawWatts*1.35/50)*50;
 const supplyWatts=psu?toNum(psu.specs?.watts)??toNum(psu.watts):null;
 const reserveWatts=supplyWatts===null?null:supplyWatts-drawWatts;
 if(psu&&knownLoads&&supplyWatts!==null&&supplyWatts<recommendedWatts)
  push('psu-capacity','error','БП '+supplyWatts+' Вт: рекомендуется не менее '+recommendedWatts+' Вт с запасом 35%.','psu','cpu','gpu');
 if(psu&&supplyWatts===null)push('psu-unknown','warning','Мощность блока питания неизвестна — проверьте паспортные данные.','psu');
 if(psu&&!knownLoads)push('power-unknown','warning','Нужны данные по потреблению процессора и видеокарты для проверки БП.','psu');
 const cpuTdp=cpuLoad,coolerTdp=toNum(field(cooler,'tdp'));
 if(cpu&&cooler&&cpuTdp&&coolerTdp&&coolerTdp<cpuTdp)
  push('cooler-capacity','warning','Заявленная рассеиваемая мощность кулера ниже энергопотребления CPU. Проверьте совместимость по рекомендациям производителя.','cooler','cpu');
 return {issues,power:{rows,drawWatts,recommendedWatts,supplyWatts,reserveWatts,knownLoads,headroomPercent:35},checked:coreSlots.filter(key=>Boolean(items[key])).length};
}
/** Disable only candidate parts that introduce or retain conflicts involving their slot. */
export function candidateErrors(step:string,product:Product,selected:BuildSelection,products:Product[]):BuildIssue[]{
 const next={...selected,[step]:product.id};
 return analyzeBuild(next,products).issues.filter(issue=>issue.severity==='error'&&issue.slots.includes(step));
}

/** Split already filtered/sorted product options without changing their relative order.
 * Existing selections and unsupported products stay visible in the optional incompatible group.
 */
export function groupCandidateOptions(
 step:string,options:ReadonlyArray<Product>,selected:BuildSelection,products:Product[]
):{compatible:Array<{product:Product;issues:BuildIssue[]}>;incompatible:Array<{product:Product;issues:BuildIssue[]}>}{
 const compatible:Array<{product:Product;issues:BuildIssue[]}>=[];
 const incompatible:Array<{product:Product;issues:BuildIssue[]}>=[];
 for(const product of options){
  const issues=candidateErrors(step,product,selected,products);
  (issues.length?incompatible:compatible).push({product,issues});
 }
 return {compatible,incompatible};
}
