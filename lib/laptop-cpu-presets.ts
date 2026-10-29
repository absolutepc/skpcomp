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
 // Additional AMD models verified against published AMD product pages and Ryzen AI 300 series guide.
 amd('Ryzen 7 7840U','7000-series',8,16,'5.1','28','AMD Radeon 780M'),
 amd('Ryzen 9 7945HX3D','7000-series',16,32,'5.4','55','AMD Radeon 610M'),
 amd('Ryzen AI 5 340','ai-300-series',6,12,'4.8','15–54','AMD Radeon 840M'),
 amd('Ryzen AI 7 350','ai-300-series',8,16,'5','15–54','AMD Radeon 860M'),
 amd('Ryzen AI 9 HX 375','ai-300-series',12,24,'5.1','15–54','AMD Radeon 890M'),
 amd('Ryzen 9 9955HX3D','9000-series',16,32,'5.4','55','AMD Radeon 610M'),
 // Intel 12th/13th generation mobile SKUs: base power (not max turbo power).
 intel('Core i5-12500H','https://www.intel.com/content/www/us/en/products/sku/96141/intel-core-i512500h-processor-18m-cache-up-to-4-50-ghz/specifications.html',12,16,'4.5','45','Intel Iris Xe Graphics (при поддержке конфигурацией)'),
 intel('Core i7-12650H','https://www.intel.com/content/www/us/en/products/sku/226066/intel-core-i712650h-processor-24m-cache-up-to-4-70-ghz/specifications.html',10,16,'4.7','45','Intel UHD Graphics'),
 intel('Core i7-12700H','https://www.intel.com/content/www/us/en/products/sku/132228/intel-core-i712700h-processor-24m-cache-up-to-4-70-ghz/specifications.html',14,20,'4.7','45','Intel Iris Xe Graphics (при поддержке конфигурацией)'),
 intel('Core i7-12800HX','https://www.intel.com/content/www/us/en/products/sku/226058/intel-core-i712800hx-processor-25m-cache-up-to-4-80-ghz/specifications.html',16,24,'4.8','55','Intel UHD Graphics'),
 intel('Core i9-12900H','https://cdrdv2-public.intel.com/755824/Why-Processor-Performance-is-More-Than-Frequency-and-Core-Counts-Final-V5.2.2022.pdf',14,20,'5','45','Intel Iris Xe Graphics (при поддержке конфигурацией)'),
 intel('Core i9-12900HX','https://www.intel.com/content/www/us/en/products/sku/228441/intel-core-i912900hx-processor-30m-cache-up-to-5-00-ghz/specifications.html',16,24,'5','55','Intel UHD Graphics'),
 intel('Core i5-13500H','https://www.intel.com/content/www/us/en/products/sku/232147/intel-core-i513500h-processor-18m-cache-up-to-4-70-ghz/specifications.html',12,16,'4.7','45','Intel Iris Xe Graphics (при поддержке конфигурацией)'),
 intel('Core i5-13500HX','https://www.intel.com/content/www/us/en/products/sku/232156/intel-core-i513500hx-processor-24m-cache-up-to-4-70-ghz/specifications.html',14,20,'4.7','55','Intel UHD Graphics'),
 intel('Core i7-13700H','https://www.intel.com/content/www/us/en/products/sku/232128/intel-core-i713700h-processor-24m-cache-up-to-5-00-ghz/specifications.html',14,20,'5','45','Intel Iris Xe Graphics (при поддержке конфигурацией)'),
 intel('Core i7-13700HX','https://www.intel.com/content/www/us/en/products/sku/232166/intel-core-i713700hx-processor-30m-cache-up-to-5-00-ghz/specifications.html',16,24,'5','55','Intel UHD Graphics'),
 intel('Core i9-13900H','https://www.intel.com/content/www/us/en/products/sku/232135/intel-core-i913900h-processor-24m-cache-up-to-5-40-ghz/specifications.html',14,20,'5.4','45','Intel Iris Xe Graphics (при поддержке конфигурацией)'),
 intel('Core i9-13900HX','https://www.intel.com/content/www/us/en/products/sku/232171/intel-core-i913900hx-processor-36m-cache-up-to-5-40-ghz/specifications.html',24,32,'5.4','55','Intel UHD Graphics'),
 // Meteor Lake (Series 1): Intel Arc is configuration-dependent.
 intel('Core Ultra 5 125H','https://cdrdv2-public.intel.com/791670/core-ultra-series-1-product-brief.pdf',14,18,'4.5','28','Intel Arc Graphics (при поддержке конфигурацией)'),
 intel('Core Ultra 5 135H','https://cdrdv2-public.intel.com/791670/core-ultra-series-1-product-brief.pdf',14,18,'4.6','28','Intel Arc Graphics (при поддержке конфигурацией)'),
 intel('Core Ultra 7 155H','https://www.intel.com/content/www/us/en/products/sku/236847/intel-core-ultra-7-processor-155h-24m-cache-up-to-4-80-ghz/specifications.html',16,22,'4.8','28','Intel Arc Graphics (при поддержке конфигурацией)'),
 intel('Core Ultra 7 165H','https://www.intel.com/content/www/us/en/products/sku/236851/intel-core-ultra-7-processor-165h-24m-cache-up-to-5-00-ghz/specifications.html',16,22,'5','28','Intel Arc Graphics (при поддержке конфигурацией)'),
 intel('Core Ultra 9 185H','https://www.intel.com/content/www/us/en/products/sku/236849/intel-core-ultra-9-processor-185h-24m-cache-up-to-5-10-ghz/specifications.html',16,22,'5.1','45','Intel Arc Graphics (при поддержке конфигурацией)'),
 // Arrow Lake-H/HX (Series 2): no Hyper-Threading, threads == cores.
 intel('Core Ultra 5 225H','https://www.intel.com/content/www/us/en/products/sku/241749/intel-core-ultra-5-processor-225h-18m-cache-up-to-4-90-ghz/specifications.html',14,14,'4.9','28','Intel Arc 130T'),
 intel('Core Ultra 5 235H','https://www.intel.com/content/www/us/en/products/sku/241748/intel-core-ultra-5-processor-235h-18m-cache-up-to-5-00-ghz/specifications.html',14,14,'5','28','Intel Arc 140T'),
 intel('Core Ultra 7 265H','https://download.intel.com/newsroom/2025/client-computing/Intel-CES2025-Performance-Preview-Keynote.pdf',16,16,'5.3','45','Intel Arc 140T'),
 intel('Core Ultra 7 255HX','https://www.intel.com/content/www/us/en/products/details/processors/core-ultra/series-2/products.html',20,20,'5.2','55','Intel Graphics'),
 intel('Core Ultra 7 265HX','https://www.intel.com/content/www/us/en/products/details/processors/core-ultra/series-2/products.html',20,20,'5.3','55','Intel Graphics'),
 intel('Core Ultra 9 285H','https://www.intel.com/content/www/us/en/products/details/processors/core-ultra/series-2/products.html',16,16,'5.4','45','Intel Arc 140T'),
 intel('Core Ultra 9 275HX','https://www.intel.com/content/www/us/en/products/sku/242293/intel-core-ultra-9-processor-275hx-36m-cache-up-to-5-40-ghz/specifications.html',24,24,'5.4','55','Intel Graphics'),
 intel('Core Ultra 9 285HX','https://www.intel.com/content/www/us/en/products/sku/242297/intel-core-ultra-9-processor-285hx-36m-cache-up-to-5-50-ghz/specifications.html',24,24,'5.5','55','Intel Graphics'),
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
