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
const {categoryFields}=load('lib/catalog.ts');
for(const cat of [...Object.keys(categoryFields),'pc'])assert.equal(comparisonMetrics(cat).length,6,cat);
assert.equal(numericValue('0,2'),.2);assert.equal(numericValue(''),null);assert.equal(numericValue('12-16'),null);
assert.equal(numericValue('Infinity'),null);
assert.equal(JSON.stringify(relativeValues(60,80,true)),JSON.stringify([1,.75]));
assert.equal(JSON.stringify(relativeValues(4000,8000)),JSON.stringify([.5,1]));
assert.equal(JSON.stringify(relativeValues(null,8000)),JSON.stringify([null,null]));
assert.equal(JSON.stringify(relativeValues(0,0)),JSON.stringify([1,1]));
const product={id:'a',name:'Mouse A',category:'mouse',price:100,stock:true,brand:'Test',image:'',art:'mouse',description:'',socket:'',memory:'',watts:0,specs:{dpi:'32000',ips:'750',acceleration:'60',polling:'8000',battery:'90',weight:'60'}};
const other={...product,id:'b',name:'Mouse B',specs:{...product.specs,weight:'80'}};
const Radar=load('app/comparison-radar.tsx').default;
const renderRadar=(b)=>renderToStaticMarkup(React.createElement(Radar,{left:product,right:b,category:'mouse'}));
const full=renderRadar(other);assert.equal((full.match(/<polygon /g)||[]).length,7);assert(!full.includes('NaN'));
const sparse=renderRadar({...other,specs:{}});assert.equal((sparse.match(/<polygon /g)||[]).length,5);assert(sparse.includes('нет данных'));
assert(!renderRadar(undefined).includes('NaN'));
const Page=load('app/compare-page.tsx').default;
for(const products of [[],[product],[product,other],[product,other,{...other,id:'c',name:'THIRD PRODUCT'}]]){
 const html=renderToStaticMarkup(React.createElement(Page,{products,onRemove(){},onClear(){},onAddCart(){},nav(){}}));
 assert(!html.includes('NaN'));assert(!html.includes('THIRD PRODUCT'));
 if(products.length===0)assert(html.includes('Пока нечего сравнивать'));
 if(products.length===1)assert(html.includes('Добавьте второй товар'));
}
assert(comparisonMetrics('pc').every(m=>m.read({...product,category:'pc',description:''})===null||m.key==='price'));
console.log('Comparison: category axes, normalization, missing data and 0/1/2-product rendering passed.');
