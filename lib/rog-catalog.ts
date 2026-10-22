import type {Product} from './seed';
export const ROG_CATALOG_VERSION=9;
const modelPatterns=[/azoth\s+extreme\s+edition\s*20/i,/harpe\s+ii\s+extreme\s+edition\s*20/i,/pg27aqwp[\s-]?w\b/i];
export const ROG_PRODUCT_IDS=["asus-rog-azoth-extreme-edition-20","asus-rog-harpe-ii-extreme-edition-20","asus-rog-swift-oled-pg27aqwp-w"];
/** One-time additive migration. Preserve merchant records, including custom IDs and prices. */
export function addRogProducts(products:Product[],defaults:Product[],version:number):Product[]{
 if(version>=ROG_CATALOG_VERSION)return products;
 const result=[...products];
 ROG_PRODUCT_IDS.forEach((id,index)=>{
  if(result.some(p=>p.id===id||modelPatterns[index].test(p.name)))return;
  const product=defaults.find(p=>p.id===id);
  if(product)result.push(product);
 });
 return result;
}
