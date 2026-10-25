import type {Product} from './seed';

const slots=[
 {id:'rtx-5070',category:'gpu'}, {id:'intel-i5',category:'cpu'},
 {id:'b760',category:'motherboard'}, {id:'ddr4',category:'ram'},
 {id:'ssd-1tb',category:'ssd'}, {id:'mouse',category:'mouse'},
];

// Keep the existing home selection, filling deleted entries from the live catalog.
// This is a curated selection, not a sales/popularity measurement.
export function popularProducts(products:Product[]):Product[]{
 const chosen=slots.map(slot=>products.find(product=>product.id===slot.id));
 const used=new Set(chosen.flatMap(product=>product?[product.id]:[]));
 const priority=(product:Product)=>(product.stock?2:0)+(product.price>0?1:0);
 const candidates=[...products].sort((a,b)=>priority(b)-priority(a));
 // Fill by category first so fallback choices cannot consume another slot's match.
 for(let i=0;i<slots.length;i++){
  if(chosen[i])continue;
  const replacement=candidates.find(product=>!used.has(product.id)&&product.category===slots[i].category);
  if(replacement){chosen[i]=replacement;used.add(replacement.id)}
 }
 for(let i=0;i<slots.length;i++){
  if(chosen[i])continue;
  const replacement=candidates.find(product=>!used.has(product.id));
  if(replacement){chosen[i]=replacement;used.add(replacement.id)}
 }
 return chosen.filter((product):product is Product=>!!product);
}
