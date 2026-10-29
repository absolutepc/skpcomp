import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

const cache=new Map();
function load(name){
 if(cache.has(name))return cache.get(name);
 const exports={};cache.set(name,exports);
 const source=readFileSync(new URL('../lib/'+name+'.ts',import.meta.url),'utf8');
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 runInNewContext(js,{exports,require:path=>load(path.replace('./',''))});
 return exports;
}
const {PRODUCT_MEDIA_FOLDERS,productMediaFolder,isProductMediaKey}=load('product-media-path');
const validFolder=new Set([...PRODUCT_MEDIA_FOLDERS]);
const base={category:'cpu',name:'Intel Core i5-14400F',brand:'Intel',socket:'LGA1700',memory:'DDR4 / DDR5',art:'cpu',specs:{}};
const folder=(overrides={})=>productMediaFolder({...base,...overrides});
const check=(changes,expected)=>{
 const actual=folder(changes);
 assert.equal(actual,expected,JSON.stringify(changes));
 assert(validFolder.has(actual),'Folder is not allowlisted: '+actual);
 return actual;
};
check({},'components/cpu/intel/LGA1700');
check({socket:'LGA1851'},'components/cpu/intel/LGA1851');
check({brand:'AMD',name:'Ryzen 7 9800X3D',socket:'AM5'},'components/cpu/amd/AM5');
check({brand:'AMD',socket:'AM4'},'components/cpu/amd/AM4');
check({brand:'AMD',socket:''},'components/cpu/amd');
check({brand:'Intel',socket:'LGA1200'},'components/cpu/intel'); // don't misclassify other sockets
check({category:'gpu',name:'Palit GeForce RTX 5070',brand:'PALIT',socket:''},'components/gpu/nvidia');
check({category:'gpu',name:'Sapphire Radeon RX 9070',brand:'Sapphire',socket:''},'components/gpu/amd');
check({category:'gpu',name:'ASRock Arc B580',brand:'ASRock',socket:''},'components/gpu/intel');
check({category:'gpu',name:'Unspecified board',brand:'Unknown',socket:''},'components/gpu');
check({category:'motherboard',name:'MSI Z790',brand:'MSI',socket:'LGA1700',memory:'DDR4'},'components/motherboard/intel/LGA1700/DDR4');
check({category:'motherboard',name:'ASUS Z790',brand:'ASUS',socket:'LGA1700',memory:'DDR5'},'components/motherboard/intel/LGA1700/DDR5');
check({category:'motherboard',name:'MSI Z790',brand:'MSI',socket:'LGA1700',memory:'DDR4 / DDR5'},'components/motherboard/intel/LGA1700');
check({category:'motherboard',socket:'',specs:{socket:'LGA1700',memory:'DDR5'},memory:''},'components/motherboard/intel/LGA1700/DDR5');
check({category:'motherboard',socket:'LGA1851',memory:'DDR5'},'components/motherboard/intel/LGA1851');
check({category:'motherboard',name:'ASUS B550',brand:'ASUS',socket:'AM4',memory:'DDR4'},'components/motherboard/amd/AM4');
check({category:'motherboard',name:'MSI X870',brand:'MSI',socket:'AM5',memory:'DDR5'},'components/motherboard/amd/AM5');
check({category:'motherboard',brand:'MSI',socket:''},'components/motherboard'); // MSI does not imply Intel
check({category:'ram',memory:'DDR4'},'components/memory/DDR4');
check({category:'ram',memory:'DDR5'},'components/memory/DDR5');
check({category:'ram',memory:'DDR4 | DDR5'},'components/memory');
check({category:'ssd'},'components/storage');
check({category:'psu'},'components/psu');
check({category:'cooler',specs:{coolingType:'Воздушное охлаждение'}},'components/cool/air-cool');
check({category:'cooler',specs:{coolingType:'Пассивное охлаждение'}},'components/cool/air-cool');
check({category:'cooler',specs:{coolingType:'Водяная система охлаждения'}},'components/cool/water-cool');
check({category:'cooler',specs:{coolingType:'Корпусный вентилятор'}},'components/cool/case-cool');
check({category:'cooler',specs:{}},'components/cool');
check({category:'case'},'components/case');
check({category:'mouse'},'periphery/mouse');
check({category:'monitor'},'periphery/monitor');
check({category:'keyboard'},'periphery/keyboard');
check({category:'peripherals',art:'headphones'},'periphery/headphones');
check({category:'peripherals',art:'unknown'},'periphery');
check({category:'laptops'},'notebooks');
check({category:'furniture'},'furniture');
check({category:'pc'},'products');
check({category:'unknown'},'products');
const id='12345678-1234-4234-8234-123456789abc';
for(const folder of PRODUCT_MEDIA_FOLDERS){
 assert.equal(isProductMediaKey(folder+'/test-item/'+id+'.webp'),true,folder);
 assert.equal(isProductMediaKey(folder+'/test-item/'+id+'.png'),true,folder);
}
for(const key of [
 'components/cpu/intel/LGA1200/test-item/'+id+'.png',
 'components/../products/test-item/'+id+'.webp',
 'components/gpu/nvidia/test-item/../../'+id+'.png',
 'unknown/test-item/'+id+'.png',
 'components/cpu/amd/AM5/test-item/'+id+'.jpg',
 'components/cpu/amd/AM5/test-item/'+id+'.webp?download=1',
 'components/cpu/amd/AM5/test-item/INVALID.webp'
])assert.equal(isProductMediaKey(key),false,'Unexpected acceptance: '+key);
const upload=readFileSync(new URL('../app/admin-product-media.tsx',import.meta.url),'utf8');
const api=readFileSync(new URL('../app/api/media/route.ts',import.meta.url),'utf8');
assert(upload.includes("data.append('productCategory',product.category)"));
assert(upload.includes("data.append('gpuChipBrand',product.specs?.gpuChipBrand||'')"));
assert(api.includes("productMediaFolder({"),'Destination must be recomputed on the server');
assert(api.includes("!MEDIA_KEY.test(key)&&!FPS_MEDIA_KEY.test(key)&&!isProductMediaKey(key)"),'Legacy, game, and new category GET keys must work');
assert(api.includes("key=folder+'/'+assetId+'/'+crypto.randomUUID()"),'Product images remain segregated by item ID');
assert(api.includes("if(!await authorized(request))"),'Upload requires admin authentication');
assert(api.includes("file.type!==mime"),'Uploaded content signatures remain validated');
console.log('Product media folders: all '+PRODUCT_MEDIA_FOLDERS.length+' allowed paths, catalog routing, old keys and security checks passed.');
