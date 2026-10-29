import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
const cache=new Map();
function load(name){
 if(cache.has(name))return cache.get(name);
 const exports={};cache.set(name,exports);
 const source=readFileSync(new URL('../lib/'+name+'.ts',import.meta.url),'utf8');
 runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
  {exports,require:path=>load(path.replace('./',''))});
 return exports;
}
const {cpuPresets,applyCpuPreset,selectedCpuPreset,clearCpuPreset}=load('cpu-presets');
const source={id:'cpu',category:'cpu',brand:'AMD',name:'Процессор OEM',price:10000,description:'Описание',image:'/cpu.webp',stock:true,socket:'AM4',memory:'DDR4',watts:65,specs:{package:'OEM',color:'Серый',socket:'AM4',memory:'DDR4',watts:'65'}};
const original=JSON.stringify(source);
const preset=cpuPresets.find(p=>p.label==='Ryzen 7 9800X3D');
const applied=applyCpuPreset(source,preset.id);
assert.equal(JSON.stringify(source),original);
assert.equal(applied.socket,'AM5');assert.equal(applied.memory,'DDR5');assert.equal(applied.watts,120);
assert.equal(applied.specs.architecture,'Zen 5');assert.equal(applied.specs.l3,'96');assert.equal(applied.specs.frequency,'4.7');
for(const key of ['name','price','description','image','stock'])assert.equal(applied[key],source[key]);
assert.equal(applied.specs.package,'OEM');assert.equal(applied.specs.color,'Серый');
assert.equal(selectedCpuPreset(applied).id,preset.id);
assert.equal(selectedCpuPreset({...applied,brand:'Intel'}),undefined);
assert.equal(selectedCpuPreset({...applied,specs:{...applied.specs,cpuModel:'Custom'}}),undefined);
assert.equal(applyCpuPreset(source,'intel-i5-14400f'),source);
const other={...source,category:'gpu'};assert.equal(applyCpuPreset(other,preset.id),other);
assert.equal(applyCpuPreset(source,'unknown'),source);
const cleared=clearCpuPreset(applied);assert.equal(selectedCpuPreset(cleared),undefined);assert.equal(cleared.specs.l3,'96');
const intel=applyCpuPreset({...source,brand:'Intel'},'intel-i5-14400f');
assert.equal(intel.socket,'LGA1700');assert.equal(intel.memory,'DDR4 / DDR5');assert.equal(intel.specs.process,'Intel 7');assert.equal(intel.specs.eCores,'4');assert.equal(intel.specs.maxTurboPower,'148');assert.equal(intel.specs.graphics,'Нет');
const amd=applyCpuPreset({...intel,brand:'AMD'},preset.id);assert.equal(amd.specs.eCores,'');assert.equal(amd.specs.maxTurboPower,'');
const edited={...applied,specs:{...applied.specs,frequency:'4.8'}};
assert.equal(selectedCpuPreset(edited).id,preset.id);assert.equal(applyCpuPreset(edited,preset.id).specs.frequency,'4.7');
assert.equal(new Set(cpuPresets.map(p=>p.id)).size,cpuPresets.length);
for(const preset of cpuPresets){
 const p=JSON.parse(JSON.stringify(applyCpuPreset({...source,brand:preset.brand},preset.id)));
 assert.equal(selectedCpuPreset(p).id,preset.id);
 for(const key of ['socket','memory','watts'])assert.equal(String(p[key]),p.specs[key]);
 for(const key of ['cpuModel','architecture','process','socket','memory','cores','threads','frequency','boost','l2','l3','watts','graphics','pcieVersion'])assert.ok(p.specs[key],preset.id+': '+key);
 assert.ok(Object.keys(p.specs).length<=80);
}
console.log('CPU presets passed: 12 models, platform sync, vendor isolation, preservation, reapply and persistence.');
