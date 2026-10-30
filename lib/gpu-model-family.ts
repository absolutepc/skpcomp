import type {Product} from './seed';

/** GPU model filtering is independent of board brand (MSI, ASUS, Palit, etc).
 * RTX 5070 and 5070 Ti are different GPUs. RTX 5060 Ti memory variants
 * are separate SKUs, and an unknown VRAM amount must not be guessed.
 */
type GpuIdentity=Pick<Product,'name'|'specs'> & Partial<Pick<Product,'description'>>;

function vramSize(product:GpuIdentity):number|null{
 const spec=product.specs?.vram||product.specs?.memorySize||'';
 const match=(spec||product.name+' '+(product.description||'')).match(/\b(\d{1,2})\s*(?:GB|ГБ)(?![A-Za-zА-Яа-я0-9])/i);
 // Catalog presets often store the numeric amount without a unit.
 const numeric=Number(spec.trim());
 const value=match?Number(match[1]):Number.isFinite(numeric)&&numeric>0?numeric:null;
 return value===8||value===16?value:null;
}

export function gpuModelFamily(product:GpuIdentity):string{
 // Prefer the specific retail model name before a generic specs.gpu preset:
 // the name may explicitly say Ti or SUPER when specs.gpu only says RTX 5070.
 const identity=[product.name||'',product.specs?.gpu||''];
 for(const source of identity){
  const geforce=source.match(/\b(?:geforce\s+)?(RTX|GTX)\s*[- ]?\s*(\d{3,4})(?:\s*(Ti|SUPER))?\b/i);
  if(geforce){
   const base=geforce[1].toUpperCase()+' '+geforce[2];
   const variant=geforce[3]?.toUpperCase()==='TI'?' Ti':geforce[3]?' SUPER':'';
   if(base==='RTX 5060'&&variant===' Ti'){
    const vram=vramSize(product);
    return vram?base+variant+' '+vram+'GB':base+variant;
   }
   return base+variant;
  }
  const radeon=source.match(/\b(?:radeon\s+)?RX\s*[- ]?\s*(\d{3,4})(?:\s*(XT|XTX))?\b/i);
  if(radeon)return 'RX '+radeon[1]+(radeon[2]?' '+radeon[2].toUpperCase():'');
  const arc=source.match(/\b(?:intel\s+)?arc\s*[- ]?\s*([AB]\d{3})\b/i);
  if(arc)return 'Arc '+arc[1].toUpperCase();
 }
 return '';
}

export function availableGpuModels(products:readonly GpuIdentity[]):string[]{
 return [...new Set(products.map(gpuModelFamily).filter(Boolean))]
  .sort((a,b)=>a.localeCompare(b,'ru',{numeric:true}));
}
