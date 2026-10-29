import type {Product} from './seed';
import {canonicalBrand} from './product-brands';

/**
 * Desktop CPU models, checked against AMD product specifications and Intel ARK/
 * Intel official desktop processor comparison tables (2026-10-29).
 * Do not derive frequencies, cache or TDP from a suffix or another SKU.
 * Intel 7 is the manufacturer's process name; Arrow Lake CPU tile is TSMC N3B.
 * Intel boost is the advertised MAX turbo, not necessarily the P-core turbo.
 * Models with F/KF have no integrated graphics. Core Ultra 200S has no SMT.
 */
export type CpuPreset={id:string;brand:'AMD'|'Intel';family:string;label:string;source:string;specs:Record<string,string>};
const amdProduct=(series:string,model:string)=>'https://www.amd.com/en/products/processors/desktops/ryzen/'+series+'-series/amd-'+model.toLowerCase().replaceAll(' ','-')+'.html';
const intelCoreComparison='https://www.intel.com/content/www/us/en/support/articles/000005505/processors.html';
const intelUltraBrief='https://www.intel.com/content/www/us/en/products/docs/processors/core-ultra/core-ultra-desktop-processors-series-2-brief.html';

type AmdCpu={model:string;series:'3000'|'4000'|'5000'|'7000'|'8000'|'9000';arch:string;cores:number;threads?:number;base:number;boost:number;l3:number;tdp:number;graphics?:string;pcieVersion?:string;process?:string;source?:string};
function amd(v:AmdCpu):CpuPreset{
 const legacy=['3000','4000','5000'].includes(v.series),mobileDie=v.series==='8000';
 const specs:Record<string,string>={
  cpuModel:v.model,architecture:v.arch,process:v.process??(legacy?'TSMC 7 нм':mobileDie||v.series==='9000'?'TSMC 4 нм':'TSMC 5 нм'),
  socket:legacy?'AM4':'AM5',memory:legacy?'DDR4':'DDR5',
  cores:String(v.cores),threads:String(v.threads??v.cores*2),
  frequency:String(v.base),boost:String(v.boost),
  l2:String(legacy?v.cores/2:v.cores),l3:String(v.l3),watts:String(v.tdp),
  graphics:v.graphics??(legacy||v.model.endsWith('F')?'Нет':'AMD Radeon Graphics'),
  pcieVersion:v.pcieVersion??(legacy?(v.series==='4000'?'3.0':'4.0'):mobileDie?'4.0':'5.0'),
  pCores:'',eCores:'',eFrequency:'',eBoost:'',maxTurboPower:''
 };
 return {id:'amd-'+v.model.toLowerCase().replaceAll(' ','-'),brand:'AMD',family:'Ryzen '+v.series,label:v.model,
  source:v.source??(['3000','4000'].includes(v.series)?'https://www.amd.com/en/support/downloads/drivers.html/processors/ryzen/ryzen-'+v.series+'-series/amd-'+v.model.toLowerCase().replaceAll(' ','-')+'.html':amdProduct(v.series,v.model)),specs};
}
type CoreCpu={sku:string;gen:'12'|'13'|'14';p:number;e:number;base:number;boost:number;l2:number;l3:number;power:number;turbo:number;eBase?:number;eTurbo?:number;pTurbo?:number;graphics?:string;source?:string;skuId?:number};
function core(v:CoreCpu):CpuPreset{
 const cores=v.p+v.e;
 const label='Core '+v.sku;
 const noGraphics=/F$/.test(v.sku);
 const graphics=noGraphics?'Нет':v.graphics??(v.p===4||cores<=10?'Intel UHD Graphics 730':'Intel UHD Graphics 770');
 const specs:Record<string,string>={
  cpuModel:label,architecture:v.gen==='12'?'Alder Lake':v.gen==='13'?'Raptor Lake':'Raptor Lake Refresh',
  process:'Intel 7',socket:'LGA1700',memory:'DDR4 / DDR5',cores:String(cores),threads:String(v.p*2+v.e),
  frequency:String(v.base),boost:String(v.boost),l2:String(v.l2),l3:String(v.l3),
  watts:String(v.power),graphics,pcieVersion:'5.0 / 4.0',
  pCores:String(v.p),eCores:String(v.e),
  eFrequency:v.eBase===undefined?'':String(v.eBase),eBoost:v.eTurbo===undefined?'':String(v.eTurbo),
  maxTurboPower:String(v.turbo),
  pBoost:String(v.pTurbo??v.boost)
 };
 return {id:'intel-'+v.sku.toLowerCase(),brand:'Intel',family:'Core '+v.gen+'-го поколения',
  label,source:v.source??(v.skuId?'https://www.intel.com/content/www/us/en/products/sku/'+v.skuId+'/specifications.html':intelCoreComparison),specs};
}
type UltraCpu={tier:5|7|9;sku:string;p:number;e:number;base:number;boost:number;pTurbo:number;eBase:number;eTurbo:number;l2:number;l3:number;power:number;turbo:number};
function ultra(v:UltraCpu):CpuPreset{
 const label='Core Ultra '+v.tier+' '+v.sku;
 const specs:Record<string,string>={
  cpuModel:label,architecture:'Arrow Lake (Lion Cove / Skymont)',
  process:'TSMC N3B',socket:'LGA1851',memory:'DDR5',
  cores:String(v.p+v.e),threads:String(v.p+v.e),frequency:String(v.base),
  boost:String(v.boost),pBoost:String(v.pTurbo),
  l2:String(v.l2),l3:String(v.l3),watts:String(v.power),
  graphics:v.sku.endsWith('F')?'Нет':'Intel Graphics',
  pcieVersion:'5.0 / 4.0',pCores:String(v.p),eCores:String(v.e),
  eFrequency:String(v.eBase),eBoost:String(v.eTurbo),maxTurboPower:String(v.turbo)
 };
 return {id:'intel-core-ultra-'+v.tier+'-'+v.sku.toLowerCase(),brand:'Intel',
  family:'Core Ultra '+v.tier+' (200S)',label,source:intelUltraBrief,specs};
}

/** All three picker levels are derived from the stable model label.
 * Existing saved preset IDs/families remain unchanged.
 */
export function cpuPresetLine(p:CpuPreset):string{
 if(p.brand==='AMD')return p.label.match(/^Ryzen (3|5|7|9) /)?.[0].trim()||'';
 return p.label.match(/^Core Ultra (5|7|9) /)?.[0].trim()||p.label.match(/^Core i[3579]-/)?.[0].replace('-','')||'';
}
export function cpuPresetGeneration(p:CpuPreset):string{
 if(p.brand==='AMD')return p.family.replace('Ryzen ','');
 return p.label.startsWith('Core Ultra ')?'Core Ultra 200':p.family.match(/Core (12|13|14)-/)?.[1]||'';
}
export const cpuPresets:readonly CpuPreset[]=[
 // Ryzen 3000: Matisse is Zen 2 / PCIe 4.0; Picasso APUs are Zen+,
 // PCIe 3.0 and have model-specific SMT and integrated Radeon Vega.
 amd({model:'Ryzen 3 3100',series:'3000',arch:'Zen 2',cores:4,base:3.6,boost:3.9,l3:16,tdp:65}),
 amd({model:'Ryzen 3 3200G',series:'3000',arch:'Zen+',cores:4,threads:4,base:3.6,boost:4,l3:4,tdp:65,process:'12 нм FinFET',pcieVersion:'3.0',graphics:'Radeon Vega 8'}),
 amd({model:'Ryzen 3 3300X',series:'3000',arch:'Zen 2',cores:4,base:3.8,boost:4.3,l3:16,tdp:65}),
 amd({model:'Ryzen 5 3400G',series:'3000',arch:'Zen+',cores:4,base:3.7,boost:4.2,l3:4,tdp:65,process:'12 нм FinFET',pcieVersion:'3.0',graphics:'Radeon RX Vega 11'}),
 amd({model:'Ryzen 5 3600',series:'3000',arch:'Zen 2',cores:6,base:3.6,boost:4.2,l3:32,tdp:65}),
 amd({model:'Ryzen 5 3600X',series:'3000',arch:'Zen 2',cores:6,base:3.8,boost:4.4,l3:32,tdp:95}),
 amd({model:'Ryzen 7 3700X',series:'3000',arch:'Zen 2',cores:8,base:3.6,boost:4.4,l3:32,tdp:65}),
 amd({model:'Ryzen 9 3900',series:'3000',arch:'Zen 2',cores:12,base:3.1,boost:4.3,l3:64,tdp:65}),
 amd({model:'Ryzen 9 3900X',series:'3000',arch:'Zen 2',cores:12,base:3.8,boost:4.6,l3:64,tdp:105}),
 amd({model:'Ryzen 9 3950X',series:'3000',arch:'Zen 2',cores:16,base:3.5,boost:4.7,l3:64,tdp:105}),
 // Ryzen 4000 desktop Renoir: Zen 2, DDR4 / AM4 / PCIe 3.0.
 // GE is a 35 W SKU; Radeon Graphics is integrated in G/GE variants.
 amd({model:'Ryzen 3 4300G',series:'4000',arch:'Zen 2',cores:4,base:3.8,boost:4,l3:4,tdp:65,graphics:'Radeon Graphics',pcieVersion:'3.0'}),
 amd({model:'Ryzen 3 4300GE',series:'4000',arch:'Zen 2',cores:4,base:3.5,boost:4,l3:4,tdp:35,graphics:'Radeon Graphics',pcieVersion:'3.0'}),
 amd({model:'Ryzen 5 4600G',series:'4000',arch:'Zen 2',cores:6,base:3.7,boost:4.2,l3:8,tdp:65,graphics:'Radeon Graphics',pcieVersion:'3.0'}),
 amd({model:'Ryzen 5 4600GE',series:'4000',arch:'Zen 2',cores:6,base:3.3,boost:4.2,l3:8,tdp:35,graphics:'Radeon Graphics',pcieVersion:'3.0'}),
 amd({model:'Ryzen 7 4700G',series:'4000',arch:'Zen 2',cores:8,base:3.6,boost:4.4,l3:8,tdp:65,graphics:'Radeon Graphics',pcieVersion:'3.0'}),
 amd({model:'Ryzen 7 4700GE',series:'4000',arch:'Zen 2',cores:8,base:3.1,boost:4.3,l3:8,tdp:35,graphics:'Radeon Graphics',pcieVersion:'3.0'}),
 // AMD Ryzen 5000 (Vermeer, AM4).
 amd({model:'Ryzen 3 5300G',series:'5000',arch:'Zen 3',cores:4,base:4,boost:4.2,l3:8,tdp:65,graphics:'Radeon Graphics',pcieVersion:'3.0',source:'https://www.amd.com/en/support/downloads/drivers.html/processors/ryzen/ryzen-5000-series/amd-ryzen-3-5300g.html'}),
 amd({model:'Ryzen 5 5600',series:'5000',arch:'Zen 3',cores:6,base:3.5,boost:4.4,l3:32,tdp:65}),
 amd({model:'Ryzen 5 5600X',series:'5000',arch:'Zen 3',cores:6,base:3.7,boost:4.6,l3:32,tdp:65}),
 amd({model:'Ryzen 7 5700X',series:'5000',arch:'Zen 3',cores:8,base:3.4,boost:4.6,l3:32,tdp:65}),
 amd({model:'Ryzen 7 5800X3D',series:'5000',arch:'Zen 3',cores:8,base:3.4,boost:4.5,l3:96,tdp:105}),
 amd({model:'Ryzen 9 5900X',series:'5000',arch:'Zen 3',cores:12,base:3.7,boost:4.8,l3:64,tdp:105}),
 amd({model:'Ryzen 9 5950X',series:'5000',arch:'Zen 3',cores:16,base:3.4,boost:4.9,l3:64,tdp:105}),
 // AMD Ryzen 7000 (Raphael, AM5); X3D has model-specific 3D V-Cache.
 amd({model:'Ryzen 5 7500F',series:'7000',arch:'Zen 4',cores:6,base:3.7,boost:5,l3:32,tdp:65}),
 amd({model:'Ryzen 5 7500X3D',series:'7000',arch:'Zen 4',cores:6,base:4,boost:4.5,l3:96,tdp:65}),
 amd({model:'Ryzen 5 7600',series:'7000',arch:'Zen 4',cores:6,base:3.8,boost:5.1,l3:32,tdp:65}),
 amd({model:'Ryzen 5 7600X',series:'7000',arch:'Zen 4',cores:6,base:4.7,boost:5.3,l3:32,tdp:105}),
 amd({model:'Ryzen 7 7700',series:'7000',arch:'Zen 4',cores:8,base:3.8,boost:5.3,l3:32,tdp:65}),
 amd({model:'Ryzen 7 7700X',series:'7000',arch:'Zen 4',cores:8,base:4.5,boost:5.4,l3:32,tdp:105}),
 amd({model:'Ryzen 7 7800X3D',series:'7000',arch:'Zen 4',cores:8,base:4.2,boost:5,l3:96,tdp:120}),
 amd({model:'Ryzen 9 7900',series:'7000',arch:'Zen 4',cores:12,base:3.7,boost:5.4,l3:64,tdp:65}),
 amd({model:'Ryzen 9 7900X',series:'7000',arch:'Zen 4',cores:12,base:4.7,boost:5.6,l3:64,tdp:170}),
 amd({model:'Ryzen 9 7900X3D',series:'7000',arch:'Zen 4',cores:12,base:4.4,boost:5.6,l3:128,tdp:120}),
 amd({model:'Ryzen 9 7950X',series:'7000',arch:'Zen 4',cores:16,base:4.5,boost:5.7,l3:64,tdp:170}),
 amd({model:'Ryzen 9 7950X3D',series:'7000',arch:'Zen 4',cores:16,base:4.2,boost:5.7,l3:128,tdp:120}),
 // AMD Ryzen 8000 (Phoenix); 8500G mixes Zen 4 and Zen 4c cores.
 amd({model:'Ryzen 5 8400F',series:'8000',arch:'Zen 4',cores:6,base:4.2,boost:4.7,l3:16,tdp:65}),
 amd({model:'Ryzen 5 8500G',series:'8000',arch:'Zen 4 / Zen 4c',cores:6,base:3.5,boost:5,l3:16,tdp:65,graphics:'AMD Radeon 740M'}),
 amd({model:'Ryzen 5 8600G',series:'8000',arch:'Zen 4',cores:6,base:4.3,boost:5,l3:16,tdp:65,graphics:'AMD Radeon 760M'}),
 amd({model:'Ryzen 7 8700G',series:'8000',arch:'Zen 4',cores:8,base:4.2,boost:5.1,l3:16,tdp:65,graphics:'AMD Radeon 780M'}),
 // AMD Ryzen 9000 (Granite Ridge).
 amd({model:'Ryzen 5 9600',series:'9000',arch:'Zen 5',cores:6,base:3.8,boost:5.2,l3:32,tdp:65}),
 amd({model:'Ryzen 5 9600X',series:'9000',arch:'Zen 5',cores:6,base:3.9,boost:5.4,l3:32,tdp:65}),
 amd({model:'Ryzen 7 9700X',series:'9000',arch:'Zen 5',cores:8,base:3.8,boost:5.5,l3:32,tdp:65}),
 amd({model:'Ryzen 7 9800X3D',series:'9000',arch:'Zen 5',cores:8,base:4.7,boost:5.2,l3:96,tdp:120}),
 amd({model:'Ryzen 9 9900X',series:'9000',arch:'Zen 5',cores:12,base:4.4,boost:5.6,l3:64,tdp:120}),
 amd({model:'Ryzen 9 9900X3D',series:'9000',arch:'Zen 5',cores:12,base:4.4,boost:5.5,l3:128,tdp:120}),
 amd({model:'Ryzen 9 9950X',series:'9000',arch:'Zen 5',cores:16,base:4.3,boost:5.7,l3:64,tdp:170}),
 amd({model:'Ryzen 9 9950X3D',series:'9000',arch:'Zen 5',cores:16,base:4.3,boost:5.7,l3:128,tdp:170}),
 // Verified 12th-generation desktop SKUs (Intel ARK): no invented i3-K or i3-KF.
 core({sku:'i3-12100',gen:'12',p:4,e:0,base:3.3,boost:4.3,l2:5,l3:12,power:60,turbo:89,skuId:134584}),
 core({sku:'i3-12100F',gen:'12',p:4,e:0,base:3.3,boost:4.3,l2:5,l3:12,power:58,turbo:89,skuId:132223}),
 core({sku:'i3-12100T',gen:'12',p:4,e:0,base:2.2,boost:4.1,l2:5,l3:12,power:35,turbo:69,skuId:223097}),
 core({sku:'i5-12500',gen:'12',p:6,e:0,base:3,boost:4.6,l2:7.5,l3:18,power:65,turbo:117,graphics:'Intel UHD Graphics 770',skuId:96144}),
 core({sku:'i5-12500T',gen:'12',p:6,e:0,base:2,boost:4.4,l2:7.5,l3:18,power:35,turbo:74,graphics:'Intel UHD Graphics 770',skuId:96140}),
 core({sku:'i5-12600',gen:'12',p:6,e:0,base:3.3,boost:4.8,l2:7.5,l3:18,power:65,turbo:117,graphics:'Intel UHD Graphics 770',skuId:96149}),
 core({sku:'i5-12600T',gen:'12',p:6,e:0,base:2.1,boost:4.6,l2:7.5,l3:18,power:35,turbo:74,graphics:'Intel UHD Graphics 770',skuId:96150}),
 core({sku:'i5-12600K',gen:'12',p:6,e:4,base:3.7,boost:4.9,l2:9.5,l3:20,power:125,turbo:150,eBase:2.8,eTurbo:3.6,graphics:'Intel UHD Graphics 770',skuId:134589}),
 core({sku:'i5-12600KF',gen:'12',p:6,e:4,base:3.7,boost:4.9,l2:9.5,l3:20,power:125,turbo:150,eBase:2.8,eTurbo:3.6,skuId:134590}),
 core({sku:'i7-12700',gen:'12',p:8,e:4,base:2.1,boost:4.9,pTurbo:4.8,l2:12,l3:25,power:65,turbo:180,eBase:1.6,eTurbo:3.6,skuId:134591}),
 core({sku:'i7-12700F',gen:'12',p:8,e:4,base:2.1,boost:4.9,pTurbo:4.8,l2:12,l3:25,power:65,turbo:180,eBase:1.6,eTurbo:3.6,skuId:134592}),
 core({sku:'i7-12700K',gen:'12',p:8,e:4,base:3.6,boost:5,pTurbo:4.9,l2:12,l3:25,power:125,turbo:190,eBase:2.7,eTurbo:3.8,skuId:134594}),
 core({sku:'i7-12700KF',gen:'12',p:8,e:4,base:3.6,boost:5,pTurbo:4.9,l2:12,l3:25,power:125,turbo:190,eBase:2.7,eTurbo:3.8,skuId:134595}),
 core({sku:'i7-12700T',gen:'12',p:8,e:4,base:1.4,boost:4.7,pTurbo:4.6,l2:12,l3:25,power:35,turbo:99,eBase:1,eTurbo:3.4,skuId:134601}),
 core({sku:'i9-12900',gen:'12',p:8,e:8,base:2.4,boost:5.1,pTurbo:5,l2:14,l3:30,power:65,turbo:202,eBase:1.8,eTurbo:3.8,skuId:134597}),
 core({sku:'i9-12900F',gen:'12',p:8,e:8,base:2.4,boost:5.1,pTurbo:5,l2:14,l3:30,power:65,turbo:202,eBase:1.8,eTurbo:3.8,skuId:134598}),
 core({sku:'i9-12900K',gen:'12',p:8,e:8,base:3.2,boost:5.2,pTurbo:5.1,l2:14,l3:30,power:125,turbo:241,eBase:2.4,eTurbo:3.9,skuId:134599}),
 core({sku:'i9-12900KF',gen:'12',p:8,e:8,base:3.2,boost:5.2,pTurbo:5.1,l2:14,l3:30,power:125,turbo:241,eBase:2.4,eTurbo:3.9,skuId:134600}),
 core({sku:'i9-12900T',gen:'12',p:8,e:8,base:1.4,boost:4.9,pTurbo:4.8,l2:14,l3:30,power:35,turbo:106,eBase:1,eTurbo:3.6,skuId:134596}),

 // 12th gen: retained existing IDs and correct Alder Lake P/E core data.
 core({sku:'i5-12400',gen:'12',p:6,e:0,base:2.5,boost:4.4,l2:7.5,l3:18,power:65,turbo:117,graphics:'Intel UHD Graphics 730'}),
 core({sku:'i5-12400F',gen:'12',p:6,e:0,base:2.5,boost:4.4,l2:7.5,l3:18,power:65,turbo:117}),
 // 13th gen; P/E frequencies and caches are per SKU, not a generation-wide default.
 core({sku:'i3-13100',gen:'13',p:4,e:0,base:3.4,boost:4.5,l2:5,l3:12,power:60,turbo:110}),
 core({sku:'i3-13100F',gen:'13',p:4,e:0,base:3.4,boost:4.5,l2:5,l3:12,power:58,turbo:110}),
 core({sku:'i5-13400F',gen:'13',p:6,e:4,base:2.5,boost:4.6,l2:9.5,l3:20,power:65,turbo:148,eBase:1.8,eTurbo:3.3}),
 core({sku:'i5-13600K',gen:'13',p:6,e:8,base:3.5,boost:5.1,l2:20,l3:24,power:125,turbo:181,eBase:2.6,eTurbo:3.9}),
 core({sku:'i5-13600KF',gen:'13',p:6,e:8,base:3.5,boost:5.1,l2:20,l3:24,power:125,turbo:181,eBase:2.6,eTurbo:3.9}),
 core({sku:'i7-13700K',gen:'13',p:8,e:8,base:3.4,boost:5.4,pTurbo:5.3,l2:24,l3:30,power:125,turbo:253,eBase:2.5,eTurbo:4.2}),
 core({sku:'i7-13700KF',gen:'13',p:8,e:8,base:3.4,boost:5.4,pTurbo:5.3,l2:24,l3:30,power:125,turbo:253,eBase:2.5,eTurbo:4.2}),
 core({sku:'i9-13900K',gen:'13',p:8,e:16,base:3,boost:5.8,pTurbo:5.4,l2:32,l3:36,power:125,turbo:253,eBase:2.2,eTurbo:4.3}),
 core({sku:'i9-13900KF',gen:'13',p:8,e:16,base:3,boost:5.8,pTurbo:5.4,l2:32,l3:36,power:125,turbo:253,eBase:2.2,eTurbo:4.3}),
 // 14th gen, including actual (rather than synthetic) T/F/K/KF SKUs.
 core({sku:'i3-14100',gen:'14',p:4,e:0,base:3.5,boost:4.7,l2:5,l3:12,power:60,turbo:110}),
 core({sku:'i3-14100F',gen:'14',p:4,e:0,base:3.5,boost:4.7,l2:5,l3:12,power:58,turbo:110}),
 core({sku:'i3-14100T',gen:'14',p:4,e:0,base:2.7,boost:4.4,l2:5,l3:12,power:35,turbo:69}),
 core({sku:'i5-14400',gen:'14',p:6,e:4,base:2.5,boost:4.7,l2:9.5,l3:20,power:65,turbo:148,eBase:1.8,eTurbo:3.5}),
 core({sku:'i5-14400F',gen:'14',p:6,e:4,base:2.5,boost:4.7,l2:9.5,l3:20,power:65,turbo:148,eBase:1.8,eTurbo:3.5}),
 core({sku:'i5-14500',gen:'14',p:6,e:8,base:2.6,boost:5,l2:11.5,l3:24,power:65,turbo:154,eBase:1.9,eTurbo:3.7}),
 core({sku:'i5-14600',gen:'14',p:6,e:8,base:2.7,boost:5.2,l2:20,l3:24,power:65,turbo:154,eBase:2,eTurbo:3.9}),
 core({sku:'i5-14600K',gen:'14',p:6,e:8,base:3.5,boost:5.3,l2:20,l3:24,power:125,turbo:181,eBase:2.6,eTurbo:4}),
 core({sku:'i5-14600KF',gen:'14',p:6,e:8,base:3.5,boost:5.3,l2:20,l3:24,power:125,turbo:181,eBase:2.6,eTurbo:4}),
 core({sku:'i5-14600T',gen:'14',p:6,e:8,base:1.8,boost:5.1,l2:20,l3:24,power:35,turbo:92,eBase:1.3,eTurbo:3.6}),
 core({sku:'i7-14700',gen:'14',p:8,e:12,base:2.1,boost:5.4,pTurbo:5.3,l2:28,l3:33,power:65,turbo:219,eBase:1.5,eTurbo:4.2}),
 core({sku:'i7-14700F',gen:'14',p:8,e:12,base:2.1,boost:5.4,pTurbo:5.3,l2:28,l3:33,power:65,turbo:219,eBase:1.5,eTurbo:4.2}),
 core({sku:'i7-14700K',gen:'14',p:8,e:12,base:3.4,boost:5.6,pTurbo:5.5,l2:28,l3:33,power:125,turbo:253,eBase:2.5,eTurbo:4.3}),
 core({sku:'i7-14700KF',gen:'14',p:8,e:12,base:3.4,boost:5.6,pTurbo:5.5,l2:28,l3:33,power:125,turbo:253,eBase:2.5,eTurbo:4.3}),
 core({sku:'i7-14700T',gen:'14',p:8,e:12,base:1.3,boost:5.2,pTurbo:5,l2:28,l3:33,power:35,turbo:106,eBase:0.9,eTurbo:3.7}),
 core({sku:'i9-14900',gen:'14',p:8,e:16,base:2,boost:5.8,pTurbo:5.4,l2:32,l3:36,power:65,turbo:219,eBase:1.5,eTurbo:4.3}),
 core({sku:'i9-14900F',gen:'14',p:8,e:16,base:2,boost:5.8,pTurbo:5.4,l2:32,l3:36,power:65,turbo:219,eBase:1.5,eTurbo:4.3}),
 core({sku:'i9-14900K',gen:'14',p:8,e:16,base:3.2,boost:6,pTurbo:5.6,l2:32,l3:36,power:125,turbo:253,eBase:2.4,eTurbo:4.4}),
 core({sku:'i9-14900KF',gen:'14',p:8,e:16,base:3.2,boost:6,pTurbo:5.6,l2:32,l3:36,power:125,turbo:253,eBase:2.4,eTurbo:4.4}),
 core({sku:'i9-14900T',gen:'14',p:8,e:16,base:1.1,boost:5.5,pTurbo:5.1,l2:32,l3:36,power:35,turbo:106,eBase:0.8,eTurbo:4}),
 // Intel Core Ultra desktop (Series 2, LGA1851), no HT: threads == cores.
 ultra({tier:5,sku:'225',p:6,e:4,base:3.3,boost:4.9,pTurbo:4.9,eBase:2.7,eTurbo:4.4,l2:22,l3:20,power:65,turbo:121}),
 ultra({tier:5,sku:'225F',p:6,e:4,base:3.3,boost:4.9,pTurbo:4.9,eBase:2.7,eTurbo:4.4,l2:22,l3:20,power:65,turbo:121}),
 ultra({tier:5,sku:'235',p:6,e:8,base:3.4,boost:5,pTurbo:5,eBase:2.9,eTurbo:4.4,l2:26,l3:24,power:65,turbo:121}),
 ultra({tier:5,sku:'245',p:6,e:8,base:3.5,boost:5.1,pTurbo:5.1,eBase:3,eTurbo:4.5,l2:26,l3:24,power:65,turbo:121}),
 ultra({tier:5,sku:'245K',p:6,e:8,base:4.2,boost:5.2,pTurbo:5.2,eBase:3.6,eTurbo:4.6,l2:26,l3:24,power:125,turbo:159}),
 ultra({tier:5,sku:'245KF',p:6,e:8,base:4.2,boost:5.2,pTurbo:5.2,eBase:3.6,eTurbo:4.6,l2:26,l3:24,power:125,turbo:159}),
 ultra({tier:7,sku:'265',p:8,e:12,base:2.4,boost:5.3,pTurbo:5.2,eBase:1.8,eTurbo:4.6,l2:36,l3:30,power:65,turbo:182}),
 ultra({tier:7,sku:'265F',p:8,e:12,base:2.4,boost:5.3,pTurbo:5.2,eBase:1.8,eTurbo:4.6,l2:36,l3:30,power:65,turbo:182}),
 ultra({tier:7,sku:'265K',p:8,e:12,base:3.9,boost:5.5,pTurbo:5.4,eBase:3.3,eTurbo:4.6,l2:36,l3:30,power:125,turbo:250}),
 ultra({tier:7,sku:'265KF',p:8,e:12,base:3.9,boost:5.5,pTurbo:5.4,eBase:3.3,eTurbo:4.6,l2:36,l3:30,power:125,turbo:250}),
 ultra({tier:9,sku:'285',p:8,e:16,base:2.5,boost:5.6,pTurbo:5.4,eBase:1.9,eTurbo:4.6,l2:40,l3:36,power:65,turbo:182}),
 ultra({tier:9,sku:'285K',p:8,e:16,base:3.7,boost:5.7,pTurbo:5.5,eBase:3.2,eTurbo:4.6,l2:40,l3:36,power:125,turbo:250})
];

export function selectedCpuPreset(product:Product){
 if(product.category!=='cpu')return;
 return cpuPresets.find(p=>p.id===product.specs?.cpuPreset&&p.brand===canonicalBrand(product.brand)&&p.specs.cpuModel===product.specs.cpuModel);
}
export function clearCpuPreset(product:Product):Product{
 const specs={...product.specs};delete specs.cpuPreset;delete specs.cpuFamily;
 return {...product,specs};
}
export function applyCpuPreset(product:Product,id:string):Product{
 const preset=cpuPresets.find(p=>p.id===id&&p.brand===canonicalBrand(product.brand));
 if(product.category!=='cpu'||!preset)return product;
 return {...product,socket:preset.specs.socket,memory:preset.specs.memory,watts:Number(preset.specs.watts),
  specs:{...product.specs,...preset.specs,cpuPreset:preset.id,cpuFamily:preset.family}};
}
