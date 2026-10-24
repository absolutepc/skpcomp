import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

function load(relative){
 const input=readFileSync(new URL('../'+relative,import.meta.url),'utf8');
 const output=ts.transpileModule(input,{fileName:relative,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 assert.equal(output.diagnostics?.filter(x=>x.category===ts.DiagnosticCategory.Error).length??0,0,relative);
 const exports={};
 runInNewContext(output.outputText,{exports,Set,Map,Array,Number,Math,JSON});
 return exports;
}
const {seed}=load('lib/seed.ts');
const {upgradeLogitechGamingMice,LOGITECH_MOUSE_IDS,LOGITECH_MOUSE_SPEC_UPDATE_VERSION}=load('lib/logitech-mouse-upgrade.ts');
const {CATALOG_VERSION}=load('lib/featured-monitor.ts');
assert.equal(seed.catalogVersion,CATALOG_VERSION);
assert.equal(CATALOG_VERSION,LOGITECH_MOUSE_SPEC_UPDATE_VERSION);
const prices={'mouse':11500,'logitech-pro-x-superlight-2-black':11500,'logitech-pro-x2-superstrike':18000,'logitech-pro-x3-superstrike-black':21000,'logitech-pro-x3-superstrike-pink':21000};
assert.deepEqual([...LOGITECH_MOUSE_IDS].sort(),Object.keys(prices).sort());
for(const id of LOGITECH_MOUSE_IDS){
 const product=seed.products.find(item=>item.id===id);
 assert.ok(product,'Catalog contains '+id);
 assert.equal(product.price,prices[id],'Price for '+id);
 assert.equal(product.specs.polling,'8000');
 assert.equal(product.specs.sensor,'HERO 2');
 assert.equal(product.specs.buttons,'5');
 for(const key of ['dpi','ips','acceleration','weight','battery','switch','shape','length','width','height','rgb','color','connection'])
  assert.ok(product.specs[key],id+' '+key);
 assert.equal(product.specs.rgb,'Нет');
 if(id.includes('x3-superstrike')){assert.equal(product.specs.dpi,'48000');assert.equal(product.specs.battery,'135');}
 if(id.includes('x2-superstrike')){assert.equal(product.specs.dpi,'44000');assert.equal(product.specs.battery,'90');}
 if(id==='mouse'||id.endsWith('superlight-2-black'))assert.equal(product.specs.battery,'95');
}
const before=seed.products.map(p=>({...p,price:prices[p.id]!==undefined?0:p.price,stock:false,
 image:p.image||'',specs:{...p.specs,extraCustomField:'Не менять'}}));
const changes=upgradeLogitechGamingMice(before,seed.products,10);
assert.equal(changes.length,before.length,'No duplicated products');
for(const id of LOGITECH_MOUSE_IDS){
 const beforeItem=before.find(p=>p.id===id),after=changes.find(p=>p.id===id);
 assert.equal(after.price,prices[id]);
 assert.equal(after.stock,beforeItem.stock,'Inventory unchanged');
 assert.equal(after.image,beforeItem.image,'Photos unchanged');
 assert.equal(after.specs.extraCustomField,'Не менять','Other custom fields remain');
}
const unrelated=seed.products.find(p=>p.id==='monitor');
assert.equal(changes.find(p=>p.id===unrelated.id),before.find(p=>p.id===unrelated.id),'Unrelated product unchanged');
assert.equal(upgradeLogitechGamingMice(changes,seed.products,11),changes,'Post-migration catalogs stay unchanged');
const removed=before.filter(p=>p.id!=='logitech-pro-x2-superstrike');
assert.equal(upgradeLogitechGamingMice(removed,seed.products,10).some(p=>p.id==='logitech-pro-x2-superstrike'),false,
 'An intentionally deleted product stays deleted');
const route=readFileSync(new URL('../app/api/store/route.ts',import.meta.url),'utf8');
assert.match(route,/upgradeLogitechGamingMice\(products,seed\.products,oldVersion\)/,'D1 upgrade connected');
console.log('Logitech mouse checks passed: five variants, correct prices and technical fields, safe saved catalog upgrade.');
