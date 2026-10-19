export function calculateInstallments(total:number, months:number, deposit:number){
 const price=Math.max(0,Math.round((Number.isFinite(total)?total:0)*100));
 const term=Math.min(12,Math.max(1,Math.trunc(Number.isFinite(months)?months:1)));
 const upfront=Math.min(price,Math.max(0,Math.round((Number.isFinite(deposit)?deposit:0)*100)));
 const principal=price-upfront;
 const markup=Math.round(principal*4*term/100);
 const financed=principal+markup;
 const regular=Math.floor(financed/term);
 const payments=Array.from({length:term},(_,i)=>(i===term-1?financed-regular*(term-1):regular)/100);
 return {months:term,deposit:upfront/100,principal:principal/100,markup:markup/100,financed:financed/100,total:(upfront+financed)/100,monthly:regular/100,payments};
}
