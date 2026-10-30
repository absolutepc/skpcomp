import type {Product} from './seed';
export type ComponentColor=''|'white'|'black';
/** An unspecified finish is not assumed to be black. Explicit catalogue colour wins. */
export function matchesComponentColor(product:Product,color:ComponentColor):boolean{
 if(!color)return true;
 const matches=(value:string)=>color==='white'?/бел|\bwhite\b/i.test(value):/ч[её]рн|\bblack\b/i.test(value);
 const label=product.specs?.color?.trim();
 if(label)return matches(label);
 const hex=product.colorHex?.trim();
 if(hex&&/^#[\da-f]{6}$/i.test(hex)){
  const rgb=[1,3,5].map(start=>parseInt(hex.slice(start,start+2),16));
  const high=Math.max(...rgb),low=Math.min(...rgb);
  return color==='white'?low>=200&&high-low<=35:high<=65;
 }
 return matches(product.name)||(color==='white'&&/\bice\b/i.test(product.name));
}
