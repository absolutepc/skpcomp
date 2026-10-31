import type {Product} from './seed';

const extraCategories=new Set(['peripherals','monitor','mouse','keyboard','headphones','mousepad','microphone','mount','webcam']);
export const isBuildExtra=(product:Product)=>extraCategories.has(product.category);
export function buildSelectionTotal(selected:Record<string,string>,products:readonly Product[],assemblyFee:number){
 const parts=Object.entries(selected).filter(([slot])=>slot!=='os').map(([,id])=>products.find(p=>p.id===id)).filter((p):p is Product=>Boolean(p));
 return parts.reduce((sum,p)=>sum+p.price,0)+(parts.length?assemblyFee:0);
}
