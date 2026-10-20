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
const {estimateFps,gameProfiles,fromReadyPC,fromConfigurator}=exports;
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
console.log('FPS model tests passed: presets, resolutions, feature support, ready PCs and configurator.');
