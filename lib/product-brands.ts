import type {Product} from './seed';

export const popularBrands=['ASUS','MSI','GIGABYTE','ASRock','PALIT','Intel','AMD','NVIDIA','Logitech','AULA','XPG','DeepCool','Kingston'];
const categoryBrands:Record<string,string[]>={
 cpu:['AMD','Intel'],
 gpu:['NVIDIA','AMD','Intel'],
 motherboard:['ASUS','MSI','GIGABYTE','ASRock'],
 ram:['XPG','Kingston','GIGABYTE'],
 ssd:['Kingston','XPG','GIGABYTE','MSI'],
 psu:['ASUS','MSI','GIGABYTE','XPG','DeepCool'],
 cooler:['ASUS','MSI','GIGABYTE','XPG','DeepCool'],
 case:['ASUS','MSI','GIGABYTE','XPG','DeepCool'],
 monitor:['ASUS','MSI','GIGABYTE','ASRock'],
 laptops:['ASUS','MSI','GIGABYTE','XPG'],
 mouse:['ASUS','MSI','GIGABYTE','Logitech','AULA','XPG','DeepCool'],
 keyboard:['ASUS','MSI','GIGABYTE','Logitech','AULA','XPG','DeepCool'],
 headphones:['ASUS','MSI','Logitech','AULA','XPG'],
 mousepad:['ASUS','MSI','GIGABYTE','Logitech','AULA','XPG','DeepCool'],
 microphone:['ASUS','Logitech'],webcam:['ASUS','Logitech'],
 mount:[],furniture:[],pc:['SKP','ASUS','MSI','GIGABYTE']
};
export function canonicalBrand(brand:string):string{
 const value=brand.trim();
 if(/^asus(?:\s+rog)?$/i.test(value))return 'ASUS';
 if(/^(?:geforce|nvidia(?:\s+geforce)?)$/i.test(value))return 'NVIDIA';
 return popularBrands.find(b=>b.toLowerCase()===value.toLowerCase())||value;
}
export function brandsForCategory(category:string,products:readonly Product[]=[]):string[]{
 const allowed=categoryBrands[category]||[];
 if(category==='cpu'||category==='gpu')return [...allowed];
 // Preserve other existing manufacturers only in their own catalogue category.
 const existing=products.filter(p=>p.category===category).map(p=>canonicalBrand(p.brand))
  .filter(b=>b&&(!popularBrands.includes(b)||allowed.includes(b)));
 return [...new Set([...allowed,...existing])];
}
export function selectedBrand(product:Product,products:readonly Product[]):string{
 const brand=canonicalBrand(product.brand);
 return brandsForCategory(product.category,products).includes(brand)?brand:'';
}
