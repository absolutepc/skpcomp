import type {Product} from './seed';

/** Model-level notebook GPU specs from NVIDIA, AMD, and Intel.
 * GPU wattage / Dynamic Boost, MUX, Advanced Optimus and actual VRAM for
 * multi-configuration chips cannot be derived from a generic GPU model.
 */
export type LaptopGpuPreset={
 name:string;source:string;
 specs:Partial<Record<'gpuVram'|'gpuMemoryType'|'gpuMemoryBus'|'gpuCudaCores'|'gpuComputeUnits'|'gpuArchitecture',string>>;
 vramOptions?:readonly string[];
};
const nvidia50='https://www.nvidia.com/en-us/geforce/laptops/compare/';
const nvidia40='https://www.nvidia.com/en-us/geforce/laptops/40-series/';
const nvidia30='https://www.nvidia.com/en-us/geforce/laptops/30-series/';
const amdSource='https://www.amd.com/en/products/specifications/graphics.html';
const intelSource='https://www.intel.com/content/www/us/en/support/articles/000091109/graphics.html';
const nv=(model:string,source:string,vrams:string[],cuda:number,bus:number,gen:string):LaptopGpuPreset=>({
 name:'GeForce RTX '+model+' Laptop GPU',source,
 specs:{gpuVram:vrams.length===1?vrams[0]:'',gpuMemoryType:gen==='Blackwell'?'GDDR7':'GDDR6',
  gpuMemoryBus:bus?String(bus):'',gpuCudaCores:cuda?String(cuda):'',gpuArchitecture:gen},
 ...(vrams.length>1?{vramOptions:vrams}:{})
});
const rx=(name:string,vram:number,units:number):LaptopGpuPreset=>({
 name:'Radeon RX '+name,source:amdSource,
 specs:{gpuVram:String(vram),gpuMemoryType:'GDDR6',gpuComputeUnits:String(units),gpuArchitecture:'RDNA 3'}
});
const arc=(name:string,vram:number,bus:number,units:number):LaptopGpuPreset=>({
 name:'Intel Arc '+name,source:intelSource,
 specs:{gpuVram:String(vram),gpuMemoryType:'GDDR6',gpuMemoryBus:String(bus),gpuComputeUnits:String(units),gpuArchitecture:'Xe-HPG'}
});
const igpu=(name:string):LaptopGpuPreset=>({
 name:'Radeon '+name,source:'https://www.amd.com/en/products/processors/laptop/ryzen.html',
 specs:{gpuVram:'',gpuMemoryType:'Общая память',gpuArchitecture:'RDNA 3.5'}
});
export const laptopGpuPresets:readonly LaptopGpuPreset[]=[
 nv('5050',nvidia50,['8'],2560,128,'Blackwell'),
 nv('5060',nvidia50,['8'],3328,128,'Blackwell'),
 nv('5070',nvidia50,['8','12'],4608,128,'Blackwell'),
 nv('5070 Ti',nvidia50,['12'],5888,192,'Blackwell'),
 nv('5080',nvidia50,['16'],7680,256,'Blackwell'),
 nv('5090',nvidia50,['24'],10496,256,'Blackwell'),
 nv('4050',nvidia40,['6'],2560,96,'Ada Lovelace'),
 nv('4060',nvidia40,['8'],3072,128,'Ada Lovelace'),
 nv('4070',nvidia40,['8'],4608,128,'Ada Lovelace'),
 nv('4080',nvidia40,['12'],7424,192,'Ada Lovelace'),
 nv('4090',nvidia40,['16'],9728,256,'Ada Lovelace'),
 nv('3050',nvidia30,['4','6'],0,0,'Ampere'),
 nv('3060',nvidia30,['6'],3840,192,'Ampere'),
 nv('3070',nvidia30,['8'],5120,256,'Ampere'),
 nv('3070 Ti',nvidia30,['8'],5888,256,'Ampere'),
 nv('3080',nvidia30,['8','16'],6144,256,'Ampere'),
 nv('3080 Ti',nvidia30,['16'],7424,256,'Ampere'),
 rx('7600S',8,28),
 rx('7600M XT',8,32),
 rx('7700S',8,32),
 rx('7900M',16,72),
 igpu('860M'),
 igpu('880M'),
 igpu('890M'),
 arc('A370M',4,64,8),
 arc('A550M',8,128,16),
 arc('A730M',12,192,24),
 arc('A770M',16,256,32)
];
export const laptopGpuSpecFields=['gpuVram','gpuMemoryType','gpuMemoryBus','gpuCudaCores','gpuComputeUnits','gpuArchitecture'] as const;
export function findLaptopGpuPreset(model:string){return laptopGpuPresets.find(p=>p.name===model);}
export function applyLaptopGpuPreset(product:Product,model:string):Product{
 if(product.category!=='laptops')return product;
 const preset=findLaptopGpuPreset(model);
 const changing=(product.specs?.gpu||'')!==model;
 const specs:Record<string,string>={...product.specs,gpu:model};
 for(const key of laptopGpuSpecFields){
  // For chips with more than one VRAM variant, don't guess, but preserve
  // a manually chosen valid capacity when reapplying the *same* GPU.
  specs[key]=(key==='gpuVram'&&preset?.vramOptions?.includes(specs.gpuVram)&&!changing)
   ?specs.gpuVram
   :preset?.specs[key]??'';
 }
 // Changing laptop GPU must not reuse the previous notebook's power limit.
 // A reapply for the same GPU should keep the user's documented TGP.
 if(changing)specs.gpuPowerWatts='';
 return {...product,specs};
}
