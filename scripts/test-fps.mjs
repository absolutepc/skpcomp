import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

// Compile just the pure estimate model to CommonJS, without starting Cloudflare.
const source=readFileSync(new URL('../lib/fps-estimate.ts',import.meta.url),'utf8');
const {outputText}=ts.transpileModule(source,{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
});
const exports={};
runInNewContext(outputText,{exports});
const {estimateFps,gameProfiles,fromReadyPC,fromConfigurator,prioritizeFpsRows}=exports;
assert.equal(gameProfiles.length,10,'All ten requested games must remain available');

const white={gpu:'RTX 5070',cpu:'AMD Ryzen 5 7500F',ram:'32 GB DDR5'};
const amd={gpu:'Radeon RX 7800 XT',cpu:'Ryzen 7 7800X3D'};
const item=(hardware,resolution,options,id)=>{
 const result=estimateFps(hardware,resolution,options);
 assert.ok(result?.length===10);
 const row=result.find(entry=>entry.id===id);
 assert.ok(row, 'Expected game '+id);
 assert.ok(Number.isFinite(row.low)&&Number.isFinite(row.high)&&row.low>0&&row.high>=row.low);
 return row;
};
for(const hardware of [white,amd]){
 for(const game of gameProfiles){
  const fhd=item(hardware,'FHD',{},game.id);
  const qhd=item(hardware,'2K',{},game.id);
  const uhd=item(hardware,'4K',{},game.id);
  assert.ok(fhd.high>=qhd.high&&qhd.high>=uhd.high,game.id+' resolution ordering');
  for(const resolution of ['FHD','2K','4K']){
   const low=item(hardware,resolution,{preset:'low'},game.id);
   const medium=item(hardware,resolution,{preset:'medium'},game.id);
   const high=item(hardware,resolution,{preset:'high'},game.id);
   const ultra=item(hardware,resolution,{preset:'ultra'},game.id);
   assert.ok(low.high>=medium.high&&medium.high>=high.high&&high.high>=ultra.high,game.id+' preset ordering');
  }
 }
}
const nativeCp=item(white,'4K',{},'cyberpunk');
const rtCp=item(white,'4K',{rayTracing:true},'cyberpunk');
assert.ok(rtCp.high<nativeCp.high);
assert.equal(rtCp.rayTracingApplied,true);
assert.equal(item(white,'4K',{rayTracing:true},'cs2').rayTracingApplied,false);
assert.equal(item(white,'4K',{rayTracing:true},'warthunder').rayTracingApplied,true);
const nativeBf=item(white,'4K',{},'bf6');
const dlssBf=item(white,'4K',{upscaling:'dlss',upscalingQuality:'performance'},'bf6');
assert.ok(dlssBf.high>nativeBf.high);
assert.equal(dlssBf.upscalingApplied,true);
assert.equal(item(white,'4K',{upscaling:'dlss'},'valorant').upscalingApplied,false);
assert.ok(item(amd,'4K',{upscaling:'fsr',upscalingQuality:'performance'},'bf6').high>
 item(amd,'4K',{},'bf6').high);
assert.equal(item(amd,'4K',{upscaling:'dlss'},'bf6').upscalingApplied,false);
assert.equal(estimateFps({gpu:'',cpu:white.cpu},'FHD'),null);
assert.equal(estimateFps({gpu:white.gpu,cpu:'Unknown processor'},'FHD'),null);
const ready=fromReadyPC({name:'SKP WHITE / RTX 5070',description:'Ryzen 5 7500F · 32 ГБ DDR5'});
assert.ok(estimateFps(ready,'FHD')?.length===10);
const config=fromConfigurator({cpu:'c1',gpu:'g1'},[
 {id:'c1',name:'Ryzen 7 7800X3D'},{id:'g1',name:'GeForce RTX 5070'}
]);
assert.ok(estimateFps(config,'2K')?.length===10);
// RT/DLSS do not affect every game; users should see supported titles first.
const mixedOptions={rayTracing:true,upscaling:'dlss',upscalingQuality:'balanced'};
const mixedRows=estimateFps(white,'FHD',mixedOptions);
assert.equal(mixedRows.filter(row=>row.rayTracingApplied).length,2);
assert.equal(mixedRows.filter(row=>row.upscalingApplied).length,4);
const mixedSorted=prioritizeFpsRows(mixedRows,mixedOptions);
assert.deepEqual(Array.from(mixedSorted.slice(0,2),row=>row.id),['warthunder','cyberpunk']);
assert.deepEqual(Array.from(mixedSorted,row=>row.id).sort(),Array.from(mixedRows,row=>row.id).sort());
assert.equal(mixedRows[0].id,'cs2','Raw profile order is unchanged');
assert.equal(mixedSorted[0].rayTracingApplied,true);
assert.ok(mixedRows.find(row=>row.id==='cyberpunk').high<
 item(white,'FHD',{upscaling:'dlss',upscalingQuality:'balanced'},'cyberpunk').high,
 'RT must lower the estimate in compatible games');
assert.equal(mixedRows.find(row=>row.id==='cs2').high,
 item(white,'FHD',{upscaling:'dlss',upscalingQuality:'balanced'},'cs2').high,
 'Unsupported RT must not fabricate a performance change');
const dlssOnlyRows=estimateFps(white,'FHD',{upscaling:'dlss'});
assert.deepEqual(Array.from(prioritizeFpsRows(dlssOnlyRows,{rayTracing:false,upscaling:'dlss'}).slice(0,4),row=>row.id),
 ['bf6','warthunder','rust','cyberpunk']);
assert.deepEqual(Array.from(prioritizeFpsRows(dlssOnlyRows,{rayTracing:false,upscaling:'native'}),row=>row.id),
 Array.from(dlssOnlyRows,row=>row.id),'Native mode must keep original order');
const fsrRows=estimateFps(amd,'4K',{upscaling:'fsr'});
assert.deepEqual(Array.from(prioritizeFpsRows(fsrRows,{rayTracing:false,upscaling:'fsr'}).slice(0,5),row=>row.id),
 ['cs2','dota2','bf6','warthunder','cyberpunk']);

/* FPS is intentionally not exposed in the SKP storefront anymore.
   Preserve the standalone estimate model for regression compatibility,
   but prevent launcher icons, buttons or FPS panels from returning. */
for(const file of ['app/shop.tsx','app/build-pages.tsx']){
 const ui=readFileSync(new URL('../'+file,import.meta.url),'utf8');
 assert.doesNotMatch(ui,/GamingFps|gaming-fps|fps-estimate|skp-fps-launch|skp-fps-inline-action|Проверить FPS|Игровая производительность/i,
  file+' must not render an FPS launcher or import FPS UI');
}
const shop=readFileSync(new URL('../app/shop.tsx',import.meta.url),'utf8');
const builds=readFileSync(new URL('../app/build-pages.tsx',import.meta.url),'utf8');
assert.match(shop,/GitCompareArrows/,'Product comparison remains available');
assert.match(builds,/Сравнить ПК/,'Ready PC comparison remains available');
assert.match(builds,/Сохранить конфигурацию/,'Configurator saving remains available');
assert.match(builds,/Добавить в корзину/,'Configurator checkout remains available');

console.log('FPS model tests passed: presets, resolutions, feature support, feature priority, ready PCs and configurator.');
