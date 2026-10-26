/** Options for the cooling category in the SKP admin product editor. */
export const coolingTypes=[
 {value:'Воздушное охлаждение',label:'Воздушное охлаждение'},
 {value:'Водяная система охлаждения',label:'Водяная система охлаждения (СЖО)'},
 {value:'Пассивное охлаждение',label:'Пассивное охлаждение'}
] as const;

export const liquidRadiatorSizes=['240','360'] as const;

/** Also recognize older free-text values without altering saved products. */
export function isLiquidCooling(value:string):boolean{
 return /сжо|водян|жидкост|aio|water|liquid/i.test(value);
}
