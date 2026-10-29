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
const cpuPresets=load('lib/laptop-cpu-presets.ts');
const gpuPresets=load('lib/laptop-gpu-presets.ts');
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
// Selecting a CPU in the notebook editor must populate actual CPU specs.
const oldValues={...laptop,specs:{...laptop.specs,cpu:'Intel Core i7-13620H',cpuCores:'10',cpuThreads:'16',
 cpuBoost:'4.9',cpuPowerWatts:'45',integratedGpu:'Intel UHD Graphics'}};
const ryzen=cpuPresets.applyLaptopCpuPreset(oldValues,'AMD Ryzen 5 7535HS');
assert.equal(ryzen.specs.cpu,'AMD Ryzen 5 7535HS');
assert.equal(ryzen.specs.cpuCores,'6');
assert.equal(ryzen.specs.cpuThreads,'12');
assert.equal(ryzen.specs.cpuBoost,'4.55');
assert.equal(ryzen.specs.cpuPowerWatts,'35–54');
assert.equal(ryzen.specs.integratedGpu,'AMD Radeon 660M');
for(const field of ['gpu','capacity','driveCapacity','gpuPowerWatts','panel','resolution','diagonal','batteryCapacity']){
 assert.equal(ryzen.specs[field],oldValues.specs[field],field+' must be preserved');
}
assert.equal(JSON.stringify(oldValues.specs),JSON.stringify({...laptop.specs,cpu:'Intel Core i7-13620H',cpuCores:'10',
 cpuThreads:'16',cpuBoost:'4.9',cpuPowerWatts:'45',integratedGpu:'Intel UHD Graphics'}),'Original unmodified');
const i7=cpuPresets.applyLaptopCpuPreset(ryzen,'Intel Core i7-13620H');
assert.equal(i7.specs.cpuCores,'10');
assert.equal(i7.specs.cpuThreads,'16');
assert.equal(i7.specs.cpuBoost,'4.9');
assert.equal(i7.specs.cpuPowerWatts,'45');
const hawk=cpuPresets.applyLaptopCpuPreset(i7,'AMD Ryzen 7 8845HS');
assert.equal(hawk.specs.cpuBoost,'5.1');
assert.equal(hawk.specs.integratedGpu,'AMD Radeon 780M');
const unverified=cpuPresets.applyLaptopCpuPreset(ryzen,'Test Unlisted CPU');
assert.equal(unverified.specs.cpu,'Test Unlisted CPU');
for(const field of cpuPresets.laptopCpuSpecFields)assert.equal(unverified.specs[field],'','Unknown CPU should not inherit stale '+field);
assert.equal(unverified.specs.gpu,ryzen.specs.gpu);
assert.equal(cpuPresets.applyLaptopCpuPreset({...oldValues,category:'gpu'},'AMD Ryzen 5 7535HS').category,'gpu');
assert.equal(cpuPresets.laptopCpuPresets.length,models.laptopProcessors.length,'Every listed laptop CPU has a verified preset');
for(const item of models.laptopProcessors)assert.ok(cpuPresets.findLaptopCpuPreset(item.name),'Missing CPU '+item.name);
assert.equal(gpuPresets.laptopGpuPresets.length,models.laptopGraphics.length,'Every listed laptop GPU has a data profile');
for(const item of models.laptopGraphics)assert.ok(gpuPresets.findLaptopGpuPreset(item.name),'Missing GPU '+item.name);
const gpuOriginal={...laptop,specs:{...laptop.specs,gpu:'GeForce RTX 4060 Laptop GPU',gpuVram:'8',gpuMemoryType:'GDDR6',gpuPowerWatts:'115'}};
const switched=gpuPresets.applyLaptopGpuPreset(gpuOriginal,'GeForce RTX 5090 Laptop GPU');
assert.equal(switched.specs.gpuVram,'24');
assert.equal(switched.specs.gpuMemoryType,'GDDR7');
assert.equal(switched.specs.gpuCudaCores,'10496');
assert.equal(switched.specs.gpuPowerWatts,'','TGP from another laptop must not be kept');
assert.equal(switched.specs.cpu,gpuOriginal.specs.cpu,'GPU change cannot overwrite CPU');
assert.equal(switched.specs.capacity,gpuOriginal.specs.capacity,'GPU change cannot overwrite RAM');
const manualTgp={...switched,specs:{...switched.specs,gpuPowerWatts:'150'}};
assert.equal(gpuPresets.applyLaptopGpuPreset(manualTgp,manualTgp.specs.gpu).specs.gpuPowerWatts,'150','Reapply preserves manually set TGP');
const multiple=gpuPresets.applyLaptopGpuPreset(gpuOriginal,'GeForce RTX 5070 Laptop GPU');
assert.equal(multiple.specs.gpuVram,'','Ambiguous VRAM must be chosen by editor');
const chosenVram={...multiple,specs:{...multiple.specs,gpuVram:'12'}};
assert.equal(gpuPresets.applyLaptopGpuPreset(chosenVram,chosenVram.specs.gpu).specs.gpuVram,'12','Reapply preserves matching VRAM variant');
const integrated=gpuPresets.applyLaptopGpuPreset(gpuOriginal,'Radeon 890M');
assert.equal(integrated.specs.gpuVram,'');
assert.equal(integrated.specs.gpuMemoryType,'Общая память');
assert.equal(integrated.specs.gpuPowerWatts,'');
const unknownGpu=gpuPresets.applyLaptopGpuPreset(switched,'Unlisted OEM Graphics');
for(const key of gpuPresets.laptopGpuSpecFields)assert.equal(unknownGpu.specs[key],'','Unknown GPU must not retain stale '+key);
assert.match(readFileSync(new URL('../app/admin-laptop-specs.tsx',import.meta.url),'utf8'),/selectGpu\\(e\\.target\\.value\\)/,
 'Notebook GPU model dropdown applies the graphics preset');
assert.equal(new Set(cpuPresets.laptopCpuPresets.map(x=>x.name)).size,cpuPresets.laptopCpuPresets.length);
assert.match(readFileSync(new URL('../app/admin-laptop-specs.tsx',import.meta.url),'utf8'),/selectCpu\(e\.target\.value\)/,
 'Notebook processor dropdown applies the CPU preset');
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
