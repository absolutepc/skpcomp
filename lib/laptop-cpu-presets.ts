import type {Product} from './seed';

/** Verified mobile CPU specifications, not desktop presets.
 * Figures are published processor specifications, not a promise about any
 * laptop's real-world clocks, thermals, memory, screen, or battery.
 * Sources link to AMD/Intel model pages or Intel's 14th-gen HX comparison.
 */
export type LaptopCpuPreset={
 name:string;source:string;specs:Partial<Record<'cpuCores'|'cpuThreads'|'cpuBoost'|'cpuPowerWatts'|'integratedGpu',string>>
};
const amd=(model:string,series:string,cores:number,threads:number,boost:string,power:string,graphics:string):LaptopCpuPreset=>({
 name:'AMD '+model,source:'https://www.amd.com/en/products/processors/laptop/ryzen/'+series+'/amd-'+model.toLowerCase().replaceAll(' ','-')+'.html',
 specs:{cpuCores:String(cores),cpuThreads:String(threads),cpuBoost:boost,cpuPowerWatts:power,integratedGpu:graphics}
});
const intel=(model:string,source:string,cores:number,threads:number,boost:string,power:string,graphics:string):LaptopCpuPreset=>({
 name:'Intel '+model,source,specs:{cpuCores:String(cores),cpuThreads:String(threads),cpuBoost:boost,cpuPowerWatts:power,integratedGpu:graphics}
});
const intelHxBrief='https://download.intel.com/newsroom/2024/client-computing/Product-Brief-Intel-Core-Processors-HX-Series.pdf';
export const laptopCpuPresets:readonly LaptopCpuPreset[]=[
 amd('Ryzen 5 7535HS','7000-series',6,12,'4.55','35–54','AMD Radeon 660M'),
 amd('Ryzen 5 7640HS','7000-series',6,12,'5','35–54','AMD Radeon 760M'),
 amd('Ryzen 7 7735HS','7000-series',8,16,'4.75','35–54','AMD Radeon 680M'),
 amd('Ryzen 7 7840HS','7000-series',8,16,'5.1','35–54','AMD Radeon 780M'),
 amd('Ryzen 9 7940HS','7000-series',8,16,'5.2','35–54','AMD Radeon 780M'),
 amd('Ryzen 9 7945HX','7000-series',16,32,'5.4','55','AMD Radeon 610M'),
 amd('Ryzen 5 8645HS','8000-series',6,12,'5','45','AMD Radeon 760M'),
 amd('Ryzen 7 8840HS','8000-series',8,16,'5.1','28','AMD Radeon 780M'),
 amd('Ryzen 7 8845HS','8000-series',8,16,'5.1','45','AMD Radeon 780M'),
 amd('Ryzen 9 8945HS','8000-series',8,16,'5.2','45','AMD Radeon 780M'),
 amd('Ryzen AI 9 365','ai-300-series',10,20,'5','28','AMD Radeon 880M'),
 amd('Ryzen AI 9 HX 370','ai-300-series',12,24,'5.1','28','AMD Radeon 890M'),
 amd('Ryzen 9 9955HX','9000-series',16,32,'5.4','55','AMD Radeon 610M'),
 intel('Core i5-12450H','https://www.intel.com/content/www/us/en/products/sku/132222/intel-core-i512450h-processor-12m-cache-up-to-4-40-ghz/specifications.html',8,12,'4.4','45','Intel UHD Graphics (12th Gen)'),
 intel('Core i5-13420H','https://www.intel.com/content/www/us/en/products/sku/232173/intel-core-i513420h-processor-12m-cache-up-to-4-60-ghz/specifications.html',8,12,'4.6','45','Intel UHD Graphics (13th Gen)'),
 intel('Core i7-13620H','https://www.intel.com/content/www/us/en/products/sku/232130/intel-core-i713620h-processor-24m-cache-up-to-4-90-ghz/specifications.html',10,16,'4.9','45','Intel UHD Graphics (13th Gen)'),
 intel('Core i5-14450HX',intelHxBrief,10,16,'4.8','55','Intel UHD Graphics'),
 intel('Core i5-14500HX',intelHxBrief,14,20,'4.9','55','Intel UHD Graphics'),
 intel('Core i7-14650HX',intelHxBrief,16,24,'5.2','55','Intel UHD Graphics'),
 intel('Core i7-14700HX',intelHxBrief,20,28,'5.5','55','Intel UHD Graphics'),
 intel('Core i9-14900HX','https://www.intel.com/content/www/us/en/products/sku/235995/intel-core-i9-processor-14900hx-36m-cache-up-to-5-80-ghz/specifications.html',24,32,'5.8','55','Intel UHD Graphics'),
 intel('Core Ultra 7 255H','https://www.intel.com/content/www/us/en/products/sku/241751/intel-core-ultra-7-processor-255h-24m-cache-up-to-5-10-ghz/specifications.html',16,16,'5.1','28','Intel Arc 140T')
];
export const laptopCpuSpecFields=['cpuCores','cpuThreads','cpuBoost','cpuPowerWatts','integratedGpu'] as const;
export function findLaptopCpuPreset(model:string):LaptopCpuPreset|undefined{
 return laptopCpuPresets.find(p=>p.name===model);
}
/** Atomic update. Do not accidentally mix Intel/AMD CPU characteristics after
 * replacing models. Preserve hardware details of the specific laptop and
 * do not write a fictitious processor TDP when AMD quotes a configurable range.
 */
export function applyLaptopCpuPreset(product:Product,model:string):Product{
 if(product.category!=='laptops')return product;
 const preset=findLaptopCpuPreset(model);
 const specs:Record<string,string>={...product.specs,cpu:model};
 for(const key of laptopCpuSpecFields)specs[key]=preset?.specs[key]??'';
 return {...product,specs};
}
