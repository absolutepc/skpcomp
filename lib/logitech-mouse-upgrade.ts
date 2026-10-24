import type {Product} from './seed';

export const LOGITECH_MOUSE_SPEC_UPDATE_VERSION=11;
export const LOGITECH_MOUSE_IDS=[
 'mouse',
 'logitech-pro-x-superlight-2-black',
 'logitech-pro-x2-superstrike',
 'logitech-pro-x3-superstrike-black',
 'logitech-pro-x3-superstrike-pink'
] as const;

/**
 * Apply the owner's requested Logitech prices and verified technical fields to
 * saved catalogs. Runs only once when catalogVersion < 11.
 *
 * No products are recreated (admin deletions remain deletions), and photos,
 * stock, name, description, gallery, color variant links and other unrelated
 * custom specifications are preserved.
 */
export function upgradeLogitechGamingMice(
 products:Product[],defaults:readonly Product[],catalogVersion:number
):Product[]{
 if(catalogVersion>=LOGITECH_MOUSE_SPEC_UPDATE_VERSION)return products;
 const ids=new Set<string>(LOGITECH_MOUSE_IDS);
 const reference=new Map(defaults.filter(p=>ids.has(p.id)).map(p=>[p.id,p]));
 return products.map(product=>{
  if(!ids.has(product.id))return product;
  const canonical=reference.get(product.id);
  if(!canonical)return product;
  return {...product,price:canonical.price,specs:{...product.specs,...canonical.specs}};
 });
}
