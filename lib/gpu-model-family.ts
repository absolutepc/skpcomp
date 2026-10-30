import type {Product} from './seed';

/** The GPU chip model is distinct from its board manufacturer (ASUS, Palit, etc).
 * Group Ti / SUPER variants under the base model so RTX 5060 matches RTX 5060 Ti.
 * Unknown OEM product names remain visible under "Все модели".
 */
export function gpuModelFamily(product:Pick<Product,'name'|'specs'>):string{
 const description=[product.specs?.gpu||'',product.name||''].join(' ');
 const geforce=description.match(/\b(?:geforce\s+)?(RTX|GTX)\s*[- ]?\s*(\d{3,4})\b/i);
 if(geforce)return geforce[1].toUpperCase()+' '+geforce[2];
 const radeon=description.match(/\b(?:radeon\s+)?RX\s*[- ]?\s*(\d{3,4})\b/i);
 if(radeon)return 'RX '+radeon[1];
 const arc=description.match(/\b(?:intel\s+)?arc\s*[- ]?\s*([AB]\d{3})\b/i);
 if(arc)return 'Arc '+arc[1].toUpperCase();
 return '';
}
export function availableGpuModels(products:readonly Pick<Product,'name'|'specs'>[]):string[]{
 return [...new Set(products.map(gpuModelFamily).filter(Boolean))]
  .sort((a,b)=>a.localeCompare(b,'ru',{numeric:true}));
}
