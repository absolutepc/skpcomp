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
const lookup=label=>{const match=cpuPresets.find(p=>p.label===label);assert.ok(match,'Missing CPU preset: '+label);return match};
assert.ok(cpuPresets.length>=70,'Extended official processor roster must include at least 70 distinct models');
const families=new Set(cpuPresets.map(p=>p.family));
for(const family of ['Core 12-го поколения','Core 13-го поколения','Core 14-го поколения','Core Ultra 5 (200S)','Core Ultra 7 (200S)','Core Ultra 9 (200S)','Ryzen 5000','Ryzen 7000','Ryzen 8000','Ryzen 9000'])assert.ok(families.has(family),family);
for(const tier of ['i3','i5','i7','i9'])assert.ok(cpuPresets.some(p=>p.label.startsWith('Core '+tier+'-')),'Missing Core '+tier);
for(const suffix of ['','F','K','KF','T'])assert.ok(cpuPresets.some(p=>p.label.startsWith('Core i')&&(suffix?p.label.endsWith(suffix):/[0-9]$/.test(p.label))),'Missing suffix '+(suffix||'plain'));
const i3=lookup('Core i3-14100');
assert.equal(i3.specs.pCores,'4');assert.equal(i3.specs.eCores,'0');assert.equal(i3.specs.frequency,'3.5');assert.equal(i3.specs.l2,'5');
assert.equal(lookup('Core i3-14100F').specs.graphics,'Нет');
assert.equal(lookup('Core i3-14100T').specs.watts,'35');
const i5=lookup('Core i5-14500');
assert.equal(i5.specs.cores,'14');assert.equal(i5.specs.l2,'11.5');assert.equal(i5.specs.frequency,'2.6');
assert.equal(lookup('Core i5-14400F').specs.eBoost,'3.5');
const k=lookup('Core i5-14600K'),kf=lookup('Core i5-14600KF');
assert.equal(k.specs.boost,'5.3');assert.equal(k.specs.watts,'125');assert.equal(k.specs.maxTurboPower,'181');
assert.equal(kf.specs.graphics,'Нет');assert.equal(kf.specs.frequency,k.specs.frequency);
const i7=lookup('Core i7-14700K');assert.equal(i7.specs.cores,'20');assert.equal(i7.specs.threads,'28');assert.equal(i7.specs.pBoost,'5.5');assert.equal(i7.specs.boost,'5.6');
const i9=lookup('Core i9-14900K');assert.equal(i9.specs.cores,'24');assert.equal(i9.specs.threads,'32');assert.equal(i9.specs.boost,'6');assert.equal(i9.specs.eCores,'16');
const i9t=lookup('Core i9-14900T');assert.equal(i9t.specs.watts,'35');assert.equal(i9t.specs.maxTurboPower,'106');
const ultra9=lookup('Core Ultra 9 285K');
assert.equal(ultra9.specs.socket,'LGA1851');assert.equal(ultra9.specs.memory,'DDR5');assert.equal(ultra9.specs.process,'TSMC N3B');
assert.equal(ultra9.specs.cores,'24');assert.equal(ultra9.specs.threads,'24');assert.equal(ultra9.specs.pBoost,'5.5');assert.equal(ultra9.specs.boost,'5.7');
const ultra5=lookup('Core Ultra 5 245KF');assert.equal(ultra5.specs.graphics,'Нет');assert.equal(ultra5.specs.maxTurboPower,'159');
assert.equal(lookup('Core Ultra 7 265').specs.threads,'20');
assert.equal(lookup('Core Ultra 5 225').specs.eCores,'4');
const ryzen9=lookup('Ryzen 9 9950X3D');assert.equal(ryzen9.specs.l3,'128');assert.equal(ryzen9.specs.cores,'16');assert.equal(ryzen9.specs.watts,'170');
assert.equal(lookup('Ryzen 9 9900X3D').specs.l3,'128');
assert.equal(lookup('Ryzen 9 7900X3D').specs.l3,'128');
assert.equal(lookup('Ryzen 9 7950X3D').specs.l3,'128');
assert.equal(lookup('Ryzen 9 5900X').specs.l2,'6','Zen 3 has 0.5 MB L2 per core');
assert.equal(lookup('Ryzen 9 5950X').specs.l2,'8');
assert.equal(lookup('Ryzen 5 5600').specs.l2,'3');
assert.equal(lookup('Ryzen 5 8500G').specs.architecture,'Zen 4 / Zen 4c');
assert.equal(lookup('Ryzen 5 8500G').specs.graphics,'AMD Radeon 740M');
assert.equal(lookup('Ryzen 5 8400F').specs.graphics,'Нет');
assert.equal(lookup('Ryzen 5 7500X3D').specs.l3,'96');
const ultraApplied=applyCpuPreset({...source,brand:'Intel'},ultra9.id);
assert.equal(selectedCpuPreset(ultraApplied)?.id,ultra9.id);
assert.equal(ultraApplied.socket,'LGA1851');
assert.equal(ultraApplied.specs.package,'OEM');
for(const p of cpuPresets){
 assert.ok(p.source.startsWith(p.brand==='AMD'?'https://www.amd.com/':'https://www.intel.com/'),p.id+': no official vendor source');
 if(p.brand==='Intel'){
  assert.equal(Number(p.specs.pCores)+Number(p.specs.eCores),Number(p.specs.cores));
  assert.ok(Number(p.specs.pBoost)<=Number(p.specs.boost),p.id+': P turbo exceeds processor max turbo');
  if(/F$/.test(p.label))assert.equal(p.specs.graphics,'Нет');
  if(p.label.startsWith('Core Ultra '))assert.equal(p.specs.threads,p.specs.cores);
 }
 if(p.brand==='AMD'&&p.family==='Ryzen 5000')assert.equal(Number(p.specs.l2),Number(p.specs.cores)/2);
}
console.log('CPU presets passed: '+cpuPresets.length+' verified entries, Intel Core variants and Ultra 200S, AMD Ryzen 9, clock/core/cache/platform checks, isolation and persistence.');
