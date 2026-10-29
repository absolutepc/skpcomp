import type {Product} from './seed';

// Editable per-component configuration for finished desktop computers.
export const buildComponentFields=[
 {key:'cpu',label:'Процессор',placeholder:'AMD Ryzen 7 9800X3D'},
 {key:'motherboard',label:'Материнская плата',placeholder:'MSI B850 Gaming Plus WiFi'},
 {key:'gpu',label:'Видеокарта',placeholder:'GeForce RTX 5070 12 ГБ'},
 {key:'ram',label:'Оперативная память',placeholder:'32 ГБ DDR5 6000 МГц (2 × 16 ГБ)'},
 {key:'ssd',label:'Основной накопитель',placeholder:'NVMe SSD 1 ТБ'},
 {key:'storage',label:'Дополнительные накопители',placeholder:'SSD 2 ТБ / HDD 4 ТБ'},
 {key:'psu',label:'Блок питания',placeholder:'850 Вт, 80 PLUS Gold'},
 {key:'cooler',label:'Охлаждение процессора',placeholder:'СЖО 360 мм'},
 {key:'case',label:'Корпус',placeholder:'Название и цвет корпуса'},
 {key:'fans',label:'Корпусные вентиляторы',placeholder:'3 × 120 мм ARGB'},
 {key:'network',label:'Wi-Fi / Bluetooth',placeholder:'Wi-Fi 6E, Bluetooth 5.3'},
 {key:'os',label:'Операционная система',placeholder:'Без ОС / Windows 11'}
] as const;

export type BuildExtraPart={name:string;value:string};

export function getBuildRows(product:Pick<Product,'buildComponents'|'buildExtras'>):{key:string;label:string;value:string}[]{
 // OS is an admin-only build option, not a physical component in the
 // public "Комплектация" gallery, mobile summary or ready-PC spec rows.
 const standard=buildComponentFields.filter(field=>field.key!=='os').flatMap(field=>{
  const value=product.buildComponents?.[field.key]?.trim();
  return value?[{key:field.key,label:field.label,value}]:[];
 });
 const extras=(product.buildExtras||[]).flatMap((part,index)=>{
  const label=part.name?.trim(),value=part.value?.trim();
  return label&&value?[{key:'extra-'+index,label,value}]:[];
 });
 return [...standard,...extras];
}

export function getReadyBuildSummary(product:Product):{key:string;label:string;value:string}[]{
 const rows=getBuildRows(product);
 if(!rows.length)return product.description.split('·').map((value,index)=>({key:'legacy-'+index,label:'',value:value.trim()})).filter(row=>row.value).slice(0,5);
 const important=['cpu','gpu','ram','ssd'];
 return [...important.flatMap(key=>rows.filter(row=>row.key===key)),...rows.filter(row=>!important.includes(row.key))].slice(0,5);
}
