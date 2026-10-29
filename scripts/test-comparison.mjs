import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url),cache=new Map();
function load(file){
 file=path.resolve(file);
 if(cache.has(file))return cache.get(file).exports;
 const source=fs.readFileSync(file,'utf8'),module={exports:{}};cache.set(file,module);
 const result=ts.transpileModule(source,{fileName:file,reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 assert.equal(result.diagnostics?.length||0,0,file+' syntax');
 const localRequire=name=>name.endsWith('.css')?{}:name.startsWith('.')?load(['.ts','.tsx'].map(ext=>path.resolve(path.dirname(file),name+ext)).find(fs.existsSync)):require(name);
 vm.runInNewContext('(function(require,module,exports){'+result.outputText+'\n})',{console})(localRequire,module,module.exports);
 return module.exports;
}
const {comparisonMetrics,relativeValues,numericValue}=load('lib/comparison-metrics.ts');
const {categoryFields,gpuFieldGroups,fieldsForProduct,specValue,matchesFilters}=load('lib/catalog.ts');
for(const cat of [...Object.keys(categoryFields),'pc'])assert.equal(comparisonMetrics(cat).length,6,cat);
assert.equal(numericValue('0,2'),.2);assert.equal(numericValue(''),null);assert.equal(numericValue('12-16'),null);
assert.equal(numericValue('Infinity'),null);
assert.equal(JSON.stringify(relativeValues(60,80,true)),JSON.stringify([1,.75]));
assert.equal(JSON.stringify(relativeValues(4000,8000)),JSON.stringify([.5,1]));
assert.equal(JSON.stringify(relativeValues(null,8000)),JSON.stringify([null,1]));
assert.equal(JSON.stringify(relativeValues(0,0)),JSON.stringify([1,1]));
const product={id:'a',name:'Mouse A',category:'mouse',price:100,stock:true,brand:'Test',image:'',art:'mouse',description:'',socket:'',memory:'',watts:0,specs:{dpi:'32000',ips:'750',acceleration:'60',polling:'8000',battery:'90',weight:'60'}};
const other={...product,id:'b',name:'Mouse B',specs:{...product.specs,weight:'80'}};
const Radar=load('app/comparison-radar.tsx').default;
const renderRadar=(b)=>renderToStaticMarkup(React.createElement(Radar,{left:product,right:b,category:'mouse'}));
const full=renderRadar(other);assert.equal((full.match(/<polygon /g)||[]).length,7);assert(!full.includes('NaN'));
const sparse=renderRadar({...other,specs:{}});assert.equal((sparse.match(/<polygon /g)||[]).length,6);assert(sparse.includes('нет данных'));
const single=renderRadar(undefined);assert(!single.includes('NaN'));assert.equal((single.match(/<polygon /g)||[]).length,6);
const partial=renderRadar({...other,specs:{polling:'4000'}});
assert.equal((partial.match(/<polygon /g)||[]).length,6);
assert.equal((partial.match(/<circle /g)||[]).length,7);
assert(partial.includes('Контур неполный'));
assert.equal(JSON.stringify(relativeValues(60,null,true)),JSON.stringify([1,null]));
assert.equal(JSON.stringify(relativeValues(null,null)),JSON.stringify([null,null]));
const Page=load('app/compare-page.tsx').default;
for(const products of [[],[product],[product,other],[product,other,{...other,id:'c',name:'THIRD PRODUCT'}]]){
 const html=renderToStaticMarkup(React.createElement(Page,{products,onRemove(){},onClear(){},onAddCart(){},nav(){}}));
 assert(!html.includes('NaN'));assert(!html.includes('THIRD PRODUCT'));
 if(products.length===0)assert(html.includes('Пока нечего сравнивать'));
 if(products.length===1)assert(html.includes('Добавьте второй товар'));
}
assert(comparisonMetrics('pc').every(m=>m.read({...product,category:'pc',description:''})===null||m.key==='price'));
console.log('Comparison: category axes, normalization, missing data and 0/1/2-product rendering passed.');

// GPU specification completeness and manufacturer-aware visibility.
assert(gpuFieldGroups.length>=5,'Grouped video card details are available in the editor');
const gpuFields=categoryFields.gpu;
assert(gpuFields.length>=35&&gpuFields.length<=80,'Extended GPU schema remains under server key limits');
assert.equal(new Set(gpuFields.map(field=>field.key)).size,gpuFields.length,'GPU specification keys must be unique');
for(const key of ['gpu','cudaCores','rtCores','tensorCores','streamProcessors','rayAccelerators',
 'xeCores','xmxEngines','baseClock','boostClock','vram','videoMemory','bus','bandwidth',
 'memorySpeed','interface','watts','recommendedPsu','powerConnectors','length','width',
 'height','slots','hdmiPorts','displayPortPorts','maxResolution']){
 assert(gpuFields.some(field=>field.key===key),'Missing GPU hardware field '+key);
}
const gpuBase={...product,category:'gpu',name:'GPU test',brand:'ASUS'};
const nvidia={...gpuBase,name:'Palit GeForce RTX 5070',brand:'PALIT',
 specs:{gpuChipBrand:'NVIDIA',gpu:'GeForce RTX 5070',vram:'12',cudaCores:'6144',rtCores:'48',tensorCores:'192'}};
const amd={...gpuBase,name:'Sapphire Radeon RX 9070',brand:'Sapphire',
 specs:{gpuChipBrand:'AMD',gpu:'Radeon RX 9070',streamProcessors:'4096',rayAccelerators:'64',cudaCores:'6144'}};
const intel={...gpuBase,name:'ASRock Arc B580',brand:'ASRock',
 specs:{gpuChipBrand:'Intel',gpu:'Arc B580',xeCores:'20',xmxEngines:'160'}};
const keys=(p)=>fieldsForProduct(p).map(field=>field.key);
assert(keys(nvidia).includes('cudaCores')&&!keys(nvidia).includes('streamProcessors')&&!keys(nvidia).includes('xeCores'));
assert(keys(amd).includes('streamProcessors')&&!keys(amd).includes('cudaCores')&&!keys(amd).includes('xmxEngines'));
assert(keys(intel).includes('xeCores')&&!keys(intel).includes('tensorCores')&&!keys(intel).includes('rayAccelerators'));
assert.equal(specValue(amd,gpuFields.find(field=>field.key==='cudaCores')),'','Do not display stale CUDA count for an AMD GPU');
assert.equal(specValue(nvidia,gpuFields.find(field=>field.key==='cudaCores')),'6144');
assert(matchesFilters(nvidia,{cudaCores:['6144']},{}));
assert(!matchesFilters(amd,{cudaCores:['6144']},{}),'AMD GPU must not pass a CUDA filter because of stale data');
assert(!matchesFilters(intel,{}, {tensorCores:{min:'1'}}),'Intel GPU must not pass a Tensor filter');
const gpuEditor=fs.readFileSync('app/shop.tsx','utf8');
assert(gpuEditor.includes("editing.category==='gpu'?gpuFieldGroups:")&&gpuEditor.includes('.map(group=><section className="skp-technical-spec-group"'),'Admin fields are shown in labeled category groups');
assert(gpuEditor.includes('field.chip===gpuChipBrand(editing)'),'Only relevant GPU field inputs are shown');
const techSpec=load('app/product-specifications.tsx').default;
const nvidiaHTML=renderToStaticMarkup(React.createElement(techSpec,{product:nvidia}));
const amdHTML=renderToStaticMarkup(React.createElement(techSpec,{product:amd}));
assert(nvidiaHTML.includes('CUDA-ядра')&&nvidiaHTML.includes('Тензорные ядра'),'NVIDIA technical specs show relevant cores');
assert(!nvidiaHTML.includes('Потоковые процессоры'),'NVIDIA specs exclude Radeon-only core labels');
assert(amdHTML.includes('Потоковые процессоры')&&!amdHTML.includes('CUDA-ядра'),'AMD technical specs never display CUDA');
// GPU radar compares six hardware specs, independently of price/form factor/PCIe.
const gpuAxes=comparisonMetrics('gpu');
assert.equal(gpuAxes.map(m=>m.key).join(','),'vram,bus,watts,baseClock,cudaCores,bandwidth');
const hardware={...nvidia,watts:250,specs:{...nvidia.specs,vram:'12',bus:'192',baseClock:'2325',memorySpeed:'28',bandwidth:'672'}};
assert.equal(gpuAxes.map(m=>m.read(hardware)).join(','),'12,192,250,2325,6144,672');
assert.equal(gpuAxes.filter(m=>m.lowerBetter).map(m=>m.key).join(','),'watts');
for(const base of [nvidia,amd,intel]){
 const gpu={...base,specs:{...base.specs,baseClock:'2000',memorySpeed:'20,5',bandwidth:'500'}};
 assert.equal(gpuAxes.find(m=>m.key==='baseClock').read(gpu),2000);
 assert.equal(gpuAxes.find(m=>m.key==='cudaCores').read(gpu),base===nvidia?6144:null);
 assert.equal(gpuAxes.find(m=>m.key==='bandwidth').read(gpu),500);
}
for(const key of ['baseClock','bandwidth'])assert.equal(gpuAxes.find(m=>m.key===key).read(nvidia),null);
const gpuRadar=renderToStaticMarkup(React.createElement(Radar,{left:hardware,right:{...hardware,id:'other'},category:'gpu'}));
assert(gpuRadar.includes('Базовая частота GPU')&&gpuRadar.includes('Пропускная способность'));
assert(!gpuRadar.includes('Версия PCIe')&&!gpuRadar.includes('Длина')&&!gpuRadar.includes('Цена')&&!gpuRadar.includes('NaN'));
console.log('GPU radar: common hardware axes, units and missing data passed.');

assert.equal(gpuAxes.find(m=>m.key==='cudaCores').read({...nvidia,specs:{gpuChipBrand:'NVIDIA'}}),null);
assert(gpuRadar.includes('CUDA-ядра')&&!gpuRadar.includes('Скорость памяти'));
