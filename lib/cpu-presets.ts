import type {Product} from './seed';
import {canonicalBrand} from './product-brands';

// Desktop specifications checked against AMD product pages and Intel ARK, 2026-10-29.
// Source URLs are stored per model. Intel 7 is a process name, not a 7 nm measurement.
export type CpuPreset={id:string;brand:'AMD'|'Intel';family:string;label:string;source:string;specs:Record<string,string>};
function amd(model:string,family:string,architecture:string,process:string,cores:number,frequency:number,boost:number,l2:number,l3:number,watts:number,graphics:string):CpuPreset{
 const slug='amd-'+model.toLowerCase().replaceAll(' ','-');
 const old=family==='5000';
 return {id:slug,brand:'AMD',family:'Ryzen '+family,label:model,
 source:old?'https://www.amd.com/en/support/downloads/drivers.html/processors/ryzen/ryzen-5000-series/'+slug+'.html':'https://www.amd.com/en/products/processors/desktops/ryzen/'+family+'-series/'+slug+'.html',
 specs:{cpuModel:model,architecture,process,socket:old?'AM4':'AM5',memory:old?'DDR4':'DDR5',cores:String(cores),threads:String(cores*2),frequency:String(frequency),boost:String(boost),l2:String(l2),l3:String(l3),watts:String(watts),graphics,pcieVersion:old||family==='8000'?'4.0':'5.0',pCores:'',eCores:'',eFrequency:'',eBoost:'',maxTurboPower:''}};
}
function intel(model:string,generation:string,sku:string,cores:number,threads:number,boost:number,l2:number,l3:number,maxPower:number,graphics='Нет'):CpuPreset{
 return {id:'intel-'+model.toLowerCase(),brand:'Intel',family:'Core '+generation+'-го поколения',label:'Core '+model,
 source:'https://www.intel.com/content/www/us/en/products/sku/'+sku+'/specifications.html',
 specs:{cpuModel:'Core '+model,architecture:generation==='12'?'Alder Lake':generation==='13'?'Raptor Lake':'Raptor Lake Refresh',process:'Intel 7',socket:'LGA1700',memory:'DDR4 / DDR5',cores:String(cores),threads:String(threads),frequency:'2.5',boost:String(boost),l2:String(l2),l3:String(l3),watts:'65',graphics,pcieVersion:'5.0 / 4.0',pCores:'6',eCores:String(cores-6),eFrequency:cores>6?'1.8':'',eBoost:cores>6?(generation==='13'?'3.3':'3.5'):'',maxTurboPower:String(maxPower)}};
}
export const cpuPresets:readonly CpuPreset[]=[
 amd('Ryzen 5 5600','5000','Zen 3','TSMC 7 нм',6,3.5,4.4,3,32,65,'Нет'),
 amd('Ryzen 5 7500F','7000','Zen 4','TSMC 5 нм',6,3.7,5,6,32,65,'Нет'),
 amd('Ryzen 5 7500X3D','7000','Zen 4','TSMC 5 нм',6,4,4.5,6,96,65,'AMD Radeon Graphics'),
 amd('Ryzen 5 7600','7000','Zen 4','TSMC 5 нм',6,3.8,5.1,6,32,65,'AMD Radeon Graphics'),
 amd('Ryzen 7 7800X3D','7000','Zen 4','TSMC 5 нм',8,4.2,5,8,96,120,'AMD Radeon Graphics'),
 amd('Ryzen 5 8400F','8000','Zen 4','TSMC 4 нм',6,4.2,4.7,6,16,65,'Нет'),
 amd('Ryzen 5 9600X','9000','Zen 5','TSMC 4 нм',6,3.9,5.4,6,32,65,'AMD Radeon Graphics'),
 amd('Ryzen 7 9800X3D','9000','Zen 5','TSMC 4 нм',8,4.7,5.2,8,96,120,'AMD Radeon Graphics'),
 intel('i5-12400','12','134586',6,12,4.4,7.5,18,117,'Intel UHD Graphics 730'),
 intel('i5-12400F','12','134587',6,12,4.4,7.5,18,117),
 intel('i5-13400F','13','230501',10,16,4.6,9.5,20,148),
 intel('i5-14400F','14','236777',10,16,4.7,9.5,20,148)
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
