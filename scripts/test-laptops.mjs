import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

function load(file,deps={}){
 const source=readFileSync(new URL('../'+file,import.meta.url),'utf8');
 const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 const exports={};
 runInNewContext(outputText,{exports,require:key=>{
  assert.ok(key in deps,'Unexpected dependency '+key+' from '+file);
  return deps[key];
 }});
 return exports;
}
const specs=load('lib/laptop-specs.ts');
const models=load('lib/laptop-models.ts');
const groups=specs.laptopFieldGroups;
assert.ok(groups.length>=6,'Laptop specs are grouped by subsystem');
const fields=groups.flatMap(group=>group.fields);
const keys=fields.map(field=>field.key);
assert.equal(new Set(keys).size,keys.length,'Laptop field identifiers must be unique');
for(const key of ['cpu','gpu','capacity','driveCapacity','diagonal','resolution','panel','refresh','gpuPowerWatts','batteryCapacity','wifi','usbC','ramSlots','m2Slots']){
 assert.ok(keys.includes(key),'Missing notebook specification: '+key);
}
for(const key of ['diagonal','panel','resolution','refresh','capacity','driveCapacity','gpuPowerWatts']){
 assert.ok(specs.laptopFieldChoices[key]?.length>0,'Quick-select options missing: '+key);
}
assert.ok(models.laptopProcessors.some(p=>p.name==='AMD Ryzen 7 8845HS'));
assert.ok(models.laptopProcessors.some(p=>p.name==='Intel Core i7-13620H'));
assert.ok(models.laptopGraphics.some(p=>p.name==='GeForce RTX 5070 Laptop GPU'));
assert.equal(new Set(models.laptopProcessors.map(p=>p.name)).size,models.laptopProcessors.length);
assert.equal(new Set(models.laptopGraphics.map(p=>p.name)).size,models.laptopGraphics.length);
const {seed}=load('lib/seed.ts');
const catalog=load('lib/catalog.ts',{'./seed':{seed},'./product-photos':{productPhotos:{}},'./product-brands':{gpuChipBrand:()=>''},'./laptop-specs':specs});
assert.equal(catalog.categoryFields.laptops.length,fields.length);
const laptop={...seed.products.find(p=>p.id==='laptop'),specs:{
 cpu:'AMD Ryzen 7 8845HS',gpu:'GeForce RTX 4060 Laptop GPU',capacity:'32',
 diagonal:'15.6',resolution:'1920 × 1080',panel:'IPS',refresh:'144',
 driveCapacity:'1024',gpuPowerWatts:'115',batteryCapacity:'90',usbC:'2'
}};
const snapshot=JSON.stringify(laptop);
const shown=catalog.fieldsForProduct(laptop).map(field=>({key:field.key,value:catalog.specValue(laptop,field)}));
assert.equal(shown.find(x=>x.key==='panel').value,'IPS');
assert.equal(shown.find(x=>x.key==='batteryCapacity').value,'90');
const {fromLaptop}=load('lib/fps-estimate.ts');
const hardware=fromLaptop(laptop);
assert.equal(hardware.platform,'laptop');
assert.equal(hardware.cpu,laptop.specs.cpu);
assert.equal(hardware.gpu,laptop.specs.gpu);
assert.equal(hardware.ram,'32 GB');
assert.equal(hardware.gpuPowerWatts,115);
assert.equal(JSON.stringify(laptop),snapshot,'Reading notebook specs does not mutate product data');
const shop=readFileSync(new URL('../app/shop.tsx',import.meta.url),'utf8');
const editor=readFileSync(new URL('../app/admin-laptop-specs.tsx',import.meta.url),'utf8');
assert.match(shop,/<AdminLaptopSpecs product=\{editing\} onChange=\{setEditing\}\/>/);
assert.match(editor,/laptopFieldGroups\.map\(/);
assert.match(editor,/laptopProcessors\.filter\(/);
assert.match(editor,/laptopGraphics\.filter\(/);
console.log('Laptop tests passed: grouped specifications, guided CPU/GPU choices, preserved product data and FPS integration.');
