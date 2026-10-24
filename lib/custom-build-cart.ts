import type {Product} from './seed';

export const PC_ASSEMBLY_FEE=3000;
export const BUILD_CORE_SLOTS=['cpu','motherboard','ram','gpu','ssd','psu','case','cooler'] as const;
export const BUILD_OPTIONAL_SLOTS=['extras'] as const;
export const BUILD_OS_OPTIONS=[
 {id:'windows-10',name:'Windows 10'},
 {id:'windows-11',name:'Windows 11'}
] as const;
export type CustomBuildCartItem={type:'custom-build';id:string;selected:Record<string,string>};
export type CartEntry=string|CustomBuildCartItem;
export type BuildDetail={slot:string;label:string;name:string;price:number};
export type CartSummaryRow={
 id:string;name:string;quantity:number;price:number;
 product?:Product;build?:CustomBuildCartItem;details?:BuildDetail[];
 assemblyFee?:number;os?:string;valid:boolean;
};
export const BUILD_SLOT_LABELS:Record<string,string>={
 cpu:'Процессор',motherboard:'Материнская плата',ram:'Оперативная память',
 gpu:'Видеокарта',ssd:'Накопитель SSD',psu:'Блок питания',case:'Корпус',
 cooler:'Охлаждение',extras:'Дополнительно'
};
export function isCustomBuild(value:unknown):value is CustomBuildCartItem{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const v=value as Record<string,unknown>;
 return v.type==='custom-build'&&typeof v.id==='string'&&/^build-[0-9a-f-]{10,70}$/i.test(v.id)&&
  v.selected!==null&&typeof v.selected==='object'&&!Array.isArray(v.selected);
}
export function cleanCart(raw:unknown):CartEntry[]{
 if(!Array.isArray(raw))return [];
 return raw.slice(0,90).filter((entry):entry is CartEntry=>
  (typeof entry==='string'&&entry.length>0&&entry.length<=100)||isCustomBuild(entry));
}
export function osName(id:unknown):string{
 return BUILD_OS_OPTIONS.find(option=>option.id===id)?.name||'Без ОС';
}
export function summarizeCart(cart:readonly CartEntry[],products:readonly Product[]):CartSummaryRow[]{
 const grouped=new Map<string,number>();
 const result:CartSummaryRow[]=[];
 for(const entry of cart){
  if(typeof entry==='string'){
   const count=(grouped.get(entry)||0)+1;grouped.set(entry,count);continue;
  }
  if(!isCustomBuild(entry))continue;
  const details:BuildDetail[]=[];
  let valid=true;
  const selected=entry.selected;
  if(Object.keys(selected).some(slot=>![...BUILD_CORE_SLOTS,...BUILD_OPTIONAL_SLOTS,'os'].includes(slot)))valid=false;
  for(const slot of BUILD_CORE_SLOTS){
   const p=products.find(item=>item.id===selected[slot]&&item.category===slot);
   if(!p||!Number.isSafeInteger(p.price)||p.price<=0){valid=false;continue}
   details.push({slot,label:BUILD_SLOT_LABELS[slot],name:p.name,price:p.price});
  }
  if(selected.extras){
   const p=products.find(item=>item.id===selected.extras&&item.category==='peripherals');
   if(!p||p.price<=0)valid=false;
   else details.push({slot:'extras',label:'Дополнительно',name:p.name,price:p.price});
  }
  if(selected.os&&!BUILD_OS_OPTIONS.some(option=>option.id===selected.os))valid=false;
  const price=details.reduce((sum,item)=>sum+item.price,0)+PC_ASSEMBLY_FEE;
  result.push({id:entry.id,name:'ПК по индивидуальной конфигурации',quantity:1,
   price,build:entry,details,assemblyFee:PC_ASSEMBLY_FEE,os:osName(selected.os),
   valid:valid&&details.length===BUILD_CORE_SLOTS.length+(selected.extras?1:0)});
 }
 for(const [id,quantity] of grouped){
  const product=products.find(p=>p.id===id);
  if(!product){result.push({id,name:'Товар отсутствует в каталоге',quantity,price:0,valid:false});continue}
  result.push({id,name:product.name,product,quantity,price:product.price,
   valid:product.price>0&&quantity<=20});
 }
 return result;
}
export function cartGrandTotal(rows:readonly CartSummaryRow[]):number{
 return rows.reduce((total,row)=>total+row.price*row.quantity,0);
}
