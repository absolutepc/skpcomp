import type {Product} from './seed';
import {isCustomBuild,summarizeCart,BUILD_CORE_SLOTS,type BuildDetail} from './custom-build-cart';

export const ORDER_STATUSES=['processing','assembled','cancelled','completed'] as const;
export type OrderStatus=typeof ORDER_STATUSES[number];
export type OrderItem={productId:string;name:string;quantity:number;unitPrice:number;subtotal:number;components?:BuildDetail[];assemblyFee?:number;os?:string};
export type OrderEvent={status:OrderStatus;createdAt:string};
export type PublicOrder={
 id:string;number:string;status:OrderStatus;items:OrderItem[];total:number;
 createdAt:string;updatedAt:string;events:OrderEvent[];
};
export type AdminOrder=PublicOrder&{customerName:string;phone:string;comment:string};
export type OrderKey={id:string;accessKey:string;number:string;createdAt:string};
export const ORDER_HISTORY_STORAGE='skp-order-history-v1';
export const MAX_ORDER_ITEMS=30;
export const ORDER_LABELS:Record<OrderStatus,string>={
 processing:'В процессе',assembled:'Собран',cancelled:'Отменён',completed:'Выполнен'
};
export const ORDER_TRANSITIONS:Record<OrderStatus,readonly OrderStatus[]>={
 processing:['assembled','cancelled'],assembled:['completed','cancelled'],
 cancelled:[],completed:[]
};
export function isOrderStatus(value:unknown):value is OrderStatus{
 return typeof value==='string'&&ORDER_STATUSES.some(status=>status===value);
}
export function canTransition(from:OrderStatus,to:OrderStatus):boolean{
 return ORDER_TRANSITIONS[from].includes(to);
}
export class OrderValidationError extends Error{}
export function normalizeOrderItems(raw:unknown,products:readonly Product[]):OrderItem[]{
 if(!Array.isArray(raw)||raw.length===0||raw.length>MAX_ORDER_ITEMS)
  throw new OrderValidationError('В заказе должно быть от 1 до 30 позиций.');
 const found=new Set<string>();
 let count=0;
 let total=0;
 const result:OrderItem[]=[];
 for(const row of raw){
  if(!row||typeof row!=='object')throw new OrderValidationError('Некорректные позиции заказа.');
  if(isCustomBuild(row)){
   if(found.has(row.id)||(row as {quantity?:unknown}).quantity!==undefined&&(row as {quantity?:unknown}).quantity!==1)
    throw new OrderValidationError('Сборка ПК должна быть отдельной позицией.');
   found.add(row.id);
   const build=summarizeCart([row],products)[0];
   if(!build?.valid||!build.details||build.details.length<BUILD_CORE_SLOTS.length)
    throw new OrderValidationError('Комплектация ПК неполная или содержит недоступные товары.');
   if(!Number.isSafeInteger(build.price)||build.price<=0)
    throw new OrderValidationError('Невозможно рассчитать стоимость сборки.');
   total+=build.price;count+=1;
   if(total>100000000||!Number.isSafeInteger(total)||count>60)
    throw new OrderValidationError('Общая сумма заказа превышает допустимый предел.');
   result.push({productId:row.id,name:build.name,quantity:1,unitPrice:build.price,
    subtotal:build.price,components:build.details,assemblyFee:build.assemblyFee,os:build.os});
   continue;
  }
  const {id,quantity}=row as Record<string,unknown>;
  if(typeof id!=='string'||!id||id.length>100||found.has(id)||!Number.isInteger(quantity)||typeof quantity!=='number'||quantity<1||quantity>20)
   throw new OrderValidationError('Проверьте товары и количество (от 1 до 20 шт. на позицию).');
  found.add(id);
  const p=products.find(product=>product.id===id);
  if(!p||!Number.isSafeInteger(p.price)||p.price<=0)
   throw new OrderValidationError('Цена одного из товаров не указана. Удалите его из заказа.');
  count+=quantity;
  if(count>60)throw new OrderValidationError('В одном заказе допускается не более 60 товаров.');
  const subtotal=p.price*quantity;
  total+=subtotal;
  if(!Number.isSafeInteger(subtotal)||!Number.isSafeInteger(total)||total>100000000)
   throw new OrderValidationError('Общая сумма заказа превышает допустимый предел.');
  result.push({productId:p.id,name:p.name.slice(0,240),quantity,unitPrice:p.price,subtotal});
 }
 return result;
}
export function validateContact(name:unknown,phone:unknown,comment:unknown){
 if(typeof name!=='string'||name.trim().length<2||name.trim().length>80)
  throw new OrderValidationError('Укажите имя длиной от 2 до 80 символов.');
 if(typeof phone!=='string'||!/^[+\d()\s-]{10,25}$/.test(phone.trim())||
   phone.replace(/\D/g,'').length<10||phone.replace(/\D/g,'').length>15)
  throw new OrderValidationError('Укажите корректный номер телефона.');
 if(typeof comment!=='string'||comment.length>500)
  throw new OrderValidationError('Комментарий не должен превышать 500 символов.');
 return {customerName:name.trim(),phone:phone.trim(),comment:comment.trim()};
}
export function orderTotal(items:readonly OrderItem[]):number{
 return items.reduce((sum,item)=>sum+item.subtotal,0);
}
export function groupCart(cart:readonly string[]):Array<{id:string;quantity:number}>{
 const grouped=new Map<string,number>();
 for(const id of cart)if(typeof id==='string')grouped.set(id,(grouped.get(id)||0)+1);
 return Array.from(grouped,([id,quantity])=>({id,quantity}));
}
export function parseOrderKeys(raw:string|null):OrderKey[]{
 try{
  const data=JSON.parse(raw||'[]');
  if(!Array.isArray(data))return [];
  const ids=new Set<string>();
  return data.filter(item=>{
   if(!item||typeof item.id!=='string'||!/^[-0-9a-f]{36}$/i.test(item.id)||
      typeof item.accessKey!=='string'||!/^[a-f0-9]{64}$/i.test(item.accessKey)||
      typeof item.number!=='string'||item.number.length>50||ids.has(item.id))return false;
   ids.add(item.id);return true;
  }).slice(0,100).map(item=>({
   id:item.id,accessKey:item.accessKey,number:item.number,
   createdAt:typeof item.createdAt==='string'?item.createdAt:''
  }));
 }catch{return []}
}
export function rememberOrder(raw:string|null,order:OrderKey):OrderKey[]{
 return [order,...parseOrderKeys(raw).filter(x=>x.id!==order.id)].slice(0,100);
}
