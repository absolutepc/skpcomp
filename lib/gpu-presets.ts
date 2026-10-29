import type {Product} from './seed';
import {gpuChipBrand} from './product-brands';

/** Desktop reference GPU specifications, checked 2026-10-29.
 * Sources: https://www.nvidia.com/en-us/geforce/graphics-cards/compare/
 * https://www.nvidia.com/en-eu/geforce/graphics-cards/40-series/
 * Board-specific clocks, power, connectors and dimensions are deliberately excluded.
 */
export const gpuGenerations=[{id:'rtx-50',label:'GeForce RTX 50',architecture:'Blackwell',pcie:'PCI Express 5.0'},
 {id:'rtx-40',label:'GeForce RTX 40',architecture:'Ada Lovelace',pcie:'PCI Express 4.0'}] as const;
export type GpuPreset={id:string;generation:string;label:string;specs:Record<string,string>};
function preset(generation:string,model:string,vram:number,memory:string,cuda:number,bus:number):GpuPreset{
 const family=gpuGenerations.find(g=>g.id===generation)!;
 return {id:model.toLowerCase().replace(/ /g,'-')+'-'+vram+'-'+memory.toLowerCase(),generation,
  label:model+' · '+vram+' ГБ '+memory,
  specs:{gpuChipBrand:'NVIDIA',gpu:'GeForce '+model,architecture:family.architecture,
   cudaCores:String(cuda),vram:String(vram),videoMemory:memory,bus:String(bus),interface:family.pcie,rayTracing:'Да'}};
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
