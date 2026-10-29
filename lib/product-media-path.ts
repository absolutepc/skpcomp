import type {Product} from './seed';
import {gpuChipBrand} from './product-brands';
import {coolingGroup} from './cooling-options';

/**
 * R2 does not have physical directories. Object-key prefixes make the desired
 * folder tree visible in the dashboard. This is an allowlist, not a client-
 * supplied free-form path. Existing products/{id}/{uuid} keys remain valid.
 */
export const PRODUCT_MEDIA_FOLDERS=[
 'components/cpu','components/cpu/intel','components/cpu/intel/LGA1700','components/cpu/intel/LGA1851',
 'components/cpu/amd','components/cpu/amd/AM4','components/cpu/amd/AM5',
 'components/gpu','components/gpu/nvidia','components/gpu/amd','components/gpu/intel',
 'components/motherboard','components/motherboard/intel','components/motherboard/intel/LGA1700',
 'components/motherboard/intel/LGA1700/DDR4','components/motherboard/intel/LGA1700/DDR5',
 'components/motherboard/intel/LGA1851',
 'components/motherboard/amd','components/motherboard/amd/AM4','components/motherboard/amd/AM5',
 'components/memory','components/memory/DDR4','components/memory/DDR5',
 'components/storage','components/psu',
 'components/cool','components/cool/air-cool','components/cool/water-cool','components/cool/case-cool',
 'components/case',
 'periphery','periphery/monitor','periphery/mouse','periphery/keyboard',
 'periphery/headphones','periphery/mousepad','periphery/microphone',
 'periphery/mount','periphery/webcam',
 'notebooks','furniture',
 // Ready-to-use PCs and unknown/legacy categories keep the existing folder.
 'products'
] as const;

const allowedFolders=new Set<string>(PRODUCT_MEDIA_FOLDERS);
type MediaProduct=Pick<Product,'category'|'brand'|'name'|'socket'|'memory'|'specs'|'art'>;
const socketOf=(p:MediaProduct)=>(p.socket||p.specs?.socket||'').toUpperCase().replace(/[\s_-]/g,'');
const memoryOf=(p:MediaProduct)=>(p.memory||p.specs?.memory||'').toUpperCase();
const hasOneMemory=(value:string):'DDR4'|'DDR5'|''=>{
 const ddr4=/\bDDR4\b/.test(value),ddr5=/\bDDR5\b/.test(value);
 return ddr4!==ddr5?(ddr4?'DDR4':'DDR5'):'';
};
const cpuPlatform=(p:MediaProduct):'intel'|'amd'|''=>{
 const brand=p.brand.trim().toLowerCase(),socket=socketOf(p);
 if(brand==='intel'||socket.startsWith('LGA'))return 'intel';
 if(brand==='amd'||/^AM[45]/.test(socket))return 'amd';
 return '';
};
const motherboardPlatform=(p:MediaProduct):'intel'|'amd'|''=>{
 const socket=socketOf(p);
 if(socket.startsWith('LGA'))return 'intel';
 if(/^AM[45]/.test(socket))return 'amd';
 // ASUS, MSI etc. are motherboard manufacturers, NOT CPU platforms.
 return '';
};

export function productMediaFolder(p:MediaProduct):string{
 const socket=socketOf(p);
 switch(p.category){
  case 'cpu':{
   const platform=cpuPlatform(p);
   const base='components/cpu'+(platform?'/'+platform:'');
   if(platform==='intel'&&(socket==='LGA1700'||socket==='LGA1851'))return base+'/'+socket;
   if(platform==='amd'&&(socket==='AM4'||socket==='AM5'))return base+'/'+socket;
   return base;
  }
  case 'gpu':{
   const chip=gpuChipBrand(p).toLowerCase();
   return 'components/gpu'+(chip?'/'+chip:'');
  }
  case 'motherboard':{
   const platform=motherboardPlatform(p);
   const base='components/motherboard'+(platform?'/'+platform:'');
   if(platform==='intel'&&socket==='LGA1700'){
    const memory=hasOneMemory(memoryOf(p));
    return base+'/LGA1700'+(memory?'/'+memory:'');
   }
   if(platform==='intel'&&socket==='LGA1851')return base+'/LGA1851';
   if(platform==='amd'&&(socket==='AM4'||socket==='AM5'))return base+'/'+socket;
   return base;
  }
  case 'ram':{
   const memory=hasOneMemory(memoryOf(p));
   return 'components/memory'+(memory?'/'+memory:'');
  }
  case 'ssd':return 'components/storage';
  case 'psu':return 'components/psu';
  case 'cooler':{
   const type=p.specs?.coolingType||'';
   if(/корпусн|case[ -]?(?:fan|cool)|вентилятор\s+(?:для\s+)?корпус/i.test(type))return 'components/cool/case-cool';
   if(coolingGroup(type)==='liquid')return 'components/cool/water-cool';
   if(coolingGroup(type)==='air'||coolingGroup(type)==='passive')return 'components/cool/air-cool';
   return 'components/cool';
  }
  case 'case':return 'components/case';
  case 'laptops':return 'notebooks';
  case 'furniture':return 'furniture';
  case 'peripherals':{
   const art=p.art.toLowerCase();
   return allowedFolders.has('periphery/'+art)?'periphery/'+art:'periphery';
  }
  default:return allowedFolders.has('periphery/'+p.category)?'periphery/'+p.category:'products';
 }
}

/** Only known, normalized R2 product image keys are accepted for public reads. */
export function isProductMediaKey(key:string):boolean{
 const match=/^([a-zA-Z0-9_/-]+)\/([a-zA-Z0-9_-]{1,90})\/([0-9a-f-]{36})\.(?:webp|png)$/.exec(key);
 return Boolean(match&&allowedFolders.has(match[1]));
}
