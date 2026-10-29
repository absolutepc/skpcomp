import type {Product} from './seed';
import {gpuChipBrand} from './product-brands';

/** Desktop reference GPU specifications, checked 2026-10-29.
 * Sources: https://www.nvidia.com/en-us/geforce/graphics-cards/compare/
 * https://www.nvidia.com/en-eu/geforce/graphics-cards/40-series/
 * Architecture tables: https://images.nvidia.com/aem-dam/Solutions/geforce/blackwell/nvidia-rtx-blackwell-gpu-architecture.pdf
 * https://images.nvidia.com/aem-dam/Solutions/Data-Center/l4/nvidia-ada-gpu-architecture-whitepaper-v2.1.pdf
 * Lower Blackwell models (original hardware review):
 * https://www.computerbase.de/artikel/grafikkarten/nvidia-geforce-rtx-5050-test.93679/
 * Memory variants: https://de.msi.com/Graphics-Card/GeForce-RTX-4070-VENTUS-2X-E1-12G-OC/Specification
 * PCIe lanes are electrical lanes, not physical slot length.
 * PSU/connectors are reference defaults, not guarantees for an ASUS/MSI/etc. board.
 * Boost clocks, board power, dimensions and cooling remain board-specific manual fields.
 * Base clocks are NVIDIA reference values in MHz (not rounded GHz).
 * https://eu.palit.com/palit/vgapro.php?id=5465&lang=de&pn=NE75070S19K9-GB2050S&tab=sp
 * https://www.computerbase.de/artikel/grafikkarten/nvidia-geforce-rtx-4060-ti-8gb-test.84209/
 * https://www.computerbase.de/artikel/grafikkarten/nvidia-geforce-rtx-4070-ti-super-test.86707/
 */
export const gpuGenerations=[{id:'rtx-50',label:'GeForce RTX 50',architecture:'Blackwell',pcie:'PCI Express 5.0'},
 {id:'rtx-40',label:'GeForce RTX 40',architecture:'Ada Lovelace',pcie:'PCI Express 4.0'}] as const;
export type GpuPreset={id:string;generation:string;label:string;specs:Record<string,string>};
type ReferenceSpecs={baseClock:number;memorySpeed:number;l2Cache:number;rops:number;pcieLanes:number;recommendedPsu:number;powerConnectors:string};
const pin16='1 × 16-pin';
const pin8='1 × 8-pin';
const referenceSpecs:Record<string,ReferenceSpecs>={
 'RTX 5090':{baseClock:2017,memorySpeed:28,l2Cache:96,rops:176,pcieLanes:16,recommendedPsu:1000,powerConnectors:pin16},
 'RTX 5080':{baseClock:2295,memorySpeed:30,l2Cache:64,rops:112,pcieLanes:16,recommendedPsu:850,powerConnectors:pin16},
 'RTX 5070 Ti':{baseClock:2295,memorySpeed:28,l2Cache:48,rops:96,pcieLanes:16,recommendedPsu:750,powerConnectors:pin16},
 'RTX 5070':{baseClock:2325,memorySpeed:28,l2Cache:48,rops:80,pcieLanes:16,recommendedPsu:650,powerConnectors:pin16},
 'RTX 5060 Ti':{baseClock:2407,memorySpeed:28,l2Cache:32,rops:48,pcieLanes:8,recommendedPsu:600,powerConnectors:pin8},
 'RTX 5060':{baseClock:2280,memorySpeed:28,l2Cache:32,rops:48,pcieLanes:8,recommendedPsu:550,powerConnectors:pin8},
 'RTX 5050':{baseClock:2317,memorySpeed:20,l2Cache:32,rops:32,pcieLanes:8,recommendedPsu:550,powerConnectors:pin8},
 'RTX 4090':{baseClock:2235,memorySpeed:21,l2Cache:72,rops:176,pcieLanes:16,recommendedPsu:850,powerConnectors:pin16},
 'RTX 4080 SUPER':{baseClock:2295,memorySpeed:23,l2Cache:64,rops:112,pcieLanes:16,recommendedPsu:750,powerConnectors:pin16},
 'RTX 4080':{baseClock:2205,memorySpeed:22.4,l2Cache:64,rops:112,pcieLanes:16,recommendedPsu:750,powerConnectors:pin16},
 'RTX 4070 Ti SUPER':{baseClock:2340,memorySpeed:21,l2Cache:48,rops:96,pcieLanes:16,recommendedPsu:700,powerConnectors:pin16},
 'RTX 4070 Ti':{baseClock:2310,memorySpeed:21,l2Cache:48,rops:80,pcieLanes:16,recommendedPsu:700,powerConnectors:pin16},
 'RTX 4070 SUPER':{baseClock:1980,memorySpeed:21,l2Cache:48,rops:80,pcieLanes:16,recommendedPsu:650,powerConnectors:pin16},
 'RTX 4070':{baseClock:1920,memorySpeed:21,l2Cache:36,rops:64,pcieLanes:16,recommendedPsu:650,powerConnectors:pin16},
 'RTX 4060 Ti':{baseClock:2310,memorySpeed:18,l2Cache:32,rops:48,pcieLanes:8,recommendedPsu:550,powerConnectors:pin8},
 'RTX 4060':{baseClock:1830,memorySpeed:17,l2Cache:24,rops:48,pcieLanes:8,recommendedPsu:550,powerConnectors:pin8}
};
function preset(generation:string,model:string,vram:number,memory:string,cuda:number,bus:number):GpuPreset{
 const family=gpuGenerations.find(g=>g.id===generation)!;
 const reference=referenceSpecs[model];
 if(!reference)throw new Error('Missing GPU reference specifications: '+model);
 const memorySpeed=model==='RTX 4070'&&memory==='GDDR6'?20:reference.memorySpeed;
 // Both architectures use 128 CUDA cores, 1 RT core, 4 Tensor cores and 4 TMUs per SM.
 const sm=cuda/128;
 return {id:model.toLowerCase().replace(/ /g,'-')+'-'+vram+'-'+memory.toLowerCase(),generation,
  label:model+' · '+vram+' ГБ '+memory,
  specs:{gpuChipBrand:'NVIDIA',gpu:'GeForce '+model,architecture:family.architecture,
   cudaCores:String(cuda),vram:String(vram),videoMemory:memory,bus:String(bus),interface:family.pcie,rayTracing:'Да',
   baseClock:String(reference.baseClock),processNm:'4',rtCores:String(sm),tensorCores:String(sm*4),textureUnits:String(sm*4),
   rops:String(reference.rops),l2Cache:String(reference.l2Cache),
   memorySpeed:String(memorySpeed),bandwidth:String(Number((memorySpeed*bus/8).toFixed(2))),
   pcieLanes:String(reference.pcieLanes),recommendedPsu:String(reference.recommendedPsu),
   powerConnectors:model==='RTX 4070'&&memory==='GDDR6'?pin8:reference.powerConnectors,
   maxResolution:'7680 × 4320',
   dlss:generation==='rtx-50'?'DLSS 5 (Multi Frame Generation)':'DLSS (Super Resolution, Ray Reconstruction, Frame Generation)' }};
}
export const gpuPresets:readonly GpuPreset[]=[
 preset('rtx-50','RTX 5090',32,'GDDR7',21760,512),
 preset('rtx-50','RTX 5080',16,'GDDR7',10752,256),
 preset('rtx-50','RTX 5070 Ti',16,'GDDR7',8960,256),
 preset('rtx-50','RTX 5070',12,'GDDR7',6144,192),
 preset('rtx-50','RTX 5060 Ti',16,'GDDR7',4608,128),
 preset('rtx-50','RTX 5060 Ti',8,'GDDR7',4608,128),
 preset('rtx-50','RTX 5060',8,'GDDR7',3840,128),
 preset('rtx-50','RTX 5050',8,'GDDR6',2560,128),
 preset('rtx-40','RTX 4090',24,'GDDR6X',16384,384),
 preset('rtx-40','RTX 4080 SUPER',16,'GDDR6X',10240,256),
 preset('rtx-40','RTX 4080',16,'GDDR6X',9728,256),
 preset('rtx-40','RTX 4070 Ti SUPER',16,'GDDR6X',8448,256),
 preset('rtx-40','RTX 4070 Ti',12,'GDDR6X',7680,192),
 preset('rtx-40','RTX 4070 SUPER',12,'GDDR6X',7168,192),
 preset('rtx-40','RTX 4070',12,'GDDR6X',5888,192),
 preset('rtx-40','RTX 4070',12,'GDDR6',5888,192),
 preset('rtx-40','RTX 4060 Ti',16,'GDDR6',4352,128),
 preset('rtx-40','RTX 4060 Ti',8,'GDDR6',4352,128),
 preset('rtx-40','RTX 4060',8,'GDDR6',3072,128)
];
export function selectedGpuPreset(product:Product):GpuPreset|undefined{
 if(product.category!=='gpu'||gpuChipBrand(product)!=='NVIDIA')return;
 const selected=gpuPresets.find(p=>p.id===product.specs?.gpuPreset);
 // Do not show a stale model/variant after its identity has been edited manually.
 return selected&&['gpu','vram','videoMemory'].every(key=>product.specs?.[key]===selected.specs[key])?selected:undefined;
}
export function applyGpuPreset(product:Product,id:string):Product{
 const selected=gpuPresets.find(p=>p.id===id);
 if(product.category!=='gpu'||gpuChipBrand(product)!=='NVIDIA'||!selected)return product;
 return {...product,specs:{...product.specs,...selected.specs,gpuPreset:selected.id,gpuGeneration:selected.generation}};
}
export function clearGpuPreset(product:Product):Product{
 const specs={...product.specs};delete specs.gpuPreset;delete specs.gpuGeneration;
 return {...product,specs};
}
