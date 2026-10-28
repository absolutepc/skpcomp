import type {Product,BrandDefinition} from './seed';
import {canonicalBrand} from './product-brands';

const brandFiles:Record<string,string>={asus:'asus',msi:'msi',gigabyte:'gigabyte',asrock:'asrock',palit:'palit',intel:'intel',amd:'amd',nvidia:'nvidia',logitech:'logitech',aula:'aula',xpg:'xpg',deepcool:'deepcool',kingston:'kingstontechnology',samsung:'samsung'};
const seriesRules:Record<string,{name:string;file:string;pattern:RegExp}[]>={
 asus:[{name:'ROG',file:'rog',pattern:/\bROG\b/i},{name:'TUF Gaming',file:'tuf',pattern:/\bTUF\b/i}],
 gigabyte:[{name:'AORUS',file:'aorus',pattern:/\bAORUS\b/i}],
 msi:['MEG','MPG','MAG'].map(name=>({name,file:name.toLowerCase(),pattern:new RegExp('\\b'+name+'\\b','i')}))
};
export function defaultBrandLogo(name:string):string{
 const file=brandFiles[canonicalBrand(name).toLowerCase()];
 return file?'/images/brands/'+file+'.svg':'';
}
export function productBrandLogo(product:Pick<Product,'brand'|'name'|'specs'>,brands?:readonly BrandDefinition[]){
 const name=canonicalBrand(product.brand);
 const brand=brands?.find(b=>canonicalBrand(b.name).toLowerCase()===name.toLowerCase());
 // A selected series takes precedence; older products can use their model name.
 const series=product.specs?.brandSeries;
 const identity=series?.trim()||product.brand+' '+product.name;
 const rule=seriesRules[name.toLowerCase()]?.find(rule=>rule.pattern.test(identity));
 if(rule)return {src:'/images/brands/'+rule.file+'.svg',label:name+' '+rule.name,builtin:true};
 // The official MSI wordmark is already available as a sharp local vector.
 // Use it for the generic MSI plaque instead of an uploaded raster logo.
 if(name.toLowerCase()==='msi')return {src:'/images/brands/msi.svg',label:product.brand,builtin:true};
 return {src:brand?.logo||defaultBrandLogo(name),label:product.brand,builtin:!brand?.logo};
}
