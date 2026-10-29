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
const {gpuPresets,applyGpuPreset,selectedGpuPreset,clearGpuPreset}=load('gpu-presets');
const source={id:'test',category:'gpu',name:'Palit White OC',brand:'PALIT',price:79990,stock:true,image:'/photo.webp',gallery:['/extra.webp'],variantGroup:'white',watts:250,
 specs:{gpuChipBrand:'NVIDIA',brandSeries:'White',color:'Белый',boostClock:'2600',length:'300',fans:'3',powerConnectors:'12V-2x6'}};
const original=JSON.stringify(source);
const find=(model,vram,memory)=>gpuPresets.find(p=>p.specs.gpu==='GeForce '+model&&p.specs.vram===String(vram)&&(!memory||p.specs.videoMemory===memory));
const rtx5070=find('RTX 5070',12);
const applied=applyGpuPreset(source,rtx5070.id);
assert.equal(JSON.stringify(source),original,'Selecting a preset must not mutate saved data');
assert.equal(applied.specs.architecture,'Blackwell');assert.equal(applied.specs.cudaCores,'6144');
assert.equal(applied.specs.videoMemory,'GDDR7');assert.equal(applied.specs.bus,'192');
assert.equal(selectedGpuPreset(applied).id,rtx5070.id);
for(const key of ['name','brand','price','image','gallery','variantGroup','watts','stock'])assert.equal(applied[key],source[key],key);
for(const key of Object.keys(source.specs))assert.equal(applied.specs[key],source.specs[key],key);
const smaller=applyGpuPreset(applied,find('RTX 4060 Ti',8).id);
assert.equal(smaller.specs.architecture,'Ada Lovelace');assert.equal(smaller.specs.vram,'8');assert.equal(smaller.specs.videoMemory,'GDDR6');assert.equal(smaller.specs.interface,'PCI Express 4.0');
assert.notEqual(find('RTX 5060 Ti',8).id,find('RTX 5060 Ti',16).id);
assert.notEqual(find('RTX 4070',12,'GDDR6').id,find('RTX 4070',12,'GDDR6X').id);
assert.equal(find('RTX 5050',8).specs.videoMemory,'GDDR6','RTX 5050 is not GDDR7');
assert.equal(selectedGpuPreset({...applied,specs:{...applied.specs,gpu:'GeForce RTX 5080'}}),undefined);
const manual=clearGpuPreset(applied);assert.equal(selectedGpuPreset(manual),undefined);assert.equal(manual.specs.gpu,applied.specs.gpu);assert.equal(manual.specs.gpuGeneration,undefined);
for(const chip of ['AMD','Intel']){const other={...source,specs:{gpuChipBrand:chip}};assert.equal(applyGpuPreset(other,rtx5070.id),other);assert.equal(selectedGpuPreset(other),undefined)}
const cpu={...source,category:'cpu'};assert.equal(applyGpuPreset(cpu,rtx5070.id),cpu);assert.equal(applyGpuPreset(source,'unknown'),source);
assert.equal(new Set(gpuPresets.map(p=>p.id)).size,gpuPresets.length);
for(const preset of gpuPresets){const saved=JSON.parse(JSON.stringify(applyGpuPreset(source,preset.id)));assert.equal(selectedGpuPreset(saved).id,preset.id);assert.ok(Object.keys(saved.specs).length<=80);}
console.log('GPU preset checks passed: variants, vendor isolation, persistence, manual editing and preserved product data.');
