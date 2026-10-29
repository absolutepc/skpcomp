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

/* FPS is available on individual PC product pages, but the user requested
   that the standalone FPS panel be removed from the configurator's bottom. */
const shop=readFileSync(new URL('../app/shop.tsx',import.meta.url),'utf8');
const builds=readFileSync(new URL('../app/build-pages.tsx',import.meta.url),'utf8');
const detailPage=readFileSync(new URL('../app/product-detail-page.tsx',import.meta.url),'utf8');
const readyMobile=readFileSync(new URL('../app/ready-pc-mobile-detail.tsx',import.meta.url),'utf8');
assert.match(detailPage,/p\.category==='pc'&&<>\s*<GamingFps product=\{p\} games=\{data\.fpsGames\} hardware=\{fromReadyPC\(p\)\} inlineAction\/>/,
 'Ready PC detail page passes active product and hardware to FPS calculator');
assert.match(detailPage,/p\.category==='laptops'&&<GamingFps product=\{p\} games=\{data\.fpsGames\} hardware=\{fromLaptop\(p\)\} inlineAction\/>/,
 'Laptop detail page passes active product and hardware to FPS calculator');
assert.match(readyMobile,/<GamingFps key=\{product\.id\} product=\{product\} games=\{games\} hardware=\{fromReadyPC\(product\)\} inlineAction\/>/,
 'Mobile ready-PC page retains the FPS calculator');
assert.doesNotMatch(builds,/<GamingFps hardware=\{fromConfigurator\(selected,data\.products\)\}\/>/,
 'Standalone FPS panel stays removed from the configurator');
assert.doesNotMatch(builds,/<GamingFps hardware=\{fromReadyPC\(p\)\} compact\/>/,
 'Only ready-PC catalog tile FPS launchers are removed');
assert.match(builds,/<CardActionButtons action="compare"/,'Ready PC comparison remains available through its shared action button');
assert.match(builds,/Сохранить конфигурацию/,'Configurator saving remains available');
assert.match(builds,/Добавить в корзину/,'Configurator checkout remains available');
assert.match(shop,/GitCompareArrows/,'Product comparison remains available');
const catalogCard=readFileSync(new URL('../app/catalog-product-card.tsx',import.meta.url),'utf8');
assert.match(catalogCard,/<CardActionButtons action="compare"/,'Catalog product comparison remains available through the shared action button');
// Opening or closing the FPS dialog must never shift the background page.
const modalSource=readFileSync(new URL('../app/gaming-fps.tsx',import.meta.url),'utf8');
assert.match(modalSource,/window\.innerWidth-document\.documentElement\.clientWidth/,
 'Scrollbar width is measured before locking desktop scrolling');
assert.match(modalSource,/body\.style\.paddingRight=.*computedPadding\+scrollbarWidth/,
 'FPS modal compensates for the disappearing desktop scrollbar');
assert.match(modalSource,/focus\(\{preventScroll:true\}\)/,
 'Modal focus does not scroll the underlying product page');
assert.match(modalSource,/body\.style\.top=.*scrollY/,
 'Mobile Safari keeps the original document offset when locking scrolling');
assert.match(modalSource,/window\.scrollTo\(scrollX,scrollY\)/,
 'Mobile scroll position is restored after closing FPS modal');
const content=readFileSync(new URL('../app/fps-calculator-content.tsx',import.meta.url),'utf8');
assert.match(content,/Выберите игру/,'FPS dialog has interactive game selection');
assert.match(content,/Настройки/,'FPS dialog keeps graphics settings');
assert.match(content,/Результаты/,'FPS dialog has results for one selected game');
assert.match(content,/getProductImages\(product\)/,'FPS dialog shows the actual product photo');
assert.match(content,/estimateFps\(/,'FPS estimates remain connected to the existing model');

// Local game artwork is used by default and upgrades only old standard URLs.
const fpsRoster=readFileSync(new URL('../lib/fps-game-catalog.ts',import.meta.url),'utf8');
assert.ok(fpsRoster.includes("id:'valorant',name:'Valorant',image:'/images/fps-games/valorant.png'"),'Valorant uses the local image');
assert.ok(fpsRoster.includes("id:'bf6',name:'Battlefield 6',image:'/images/fps-games/battlefield6.png'"),'Battlefield 6 uses the local image');
assert.ok(fpsRoster.includes("game.image===oldValorantImage"),'Legacy Valorant default images are upgraded');
assert.ok(fpsRoster.includes("game.image===steam(2807960)"),'Legacy Battlefield 6 default images are upgraded');
// FPS artwork upload must be available in the admin interface and backed by R2.
const fpsEditor=readFileSync(new URL('../app/admin-fps-games.tsx',import.meta.url),'utf8');
const mediaBackend=readFileSync(new URL('../app/api/media/route.ts',import.meta.url),'utf8');
assert(fpsEditor.includes('accept="image/png,image/jpeg,image/webp"'),'FPS editor must have a local upload picker');
assert(fpsEditor.includes("form.append('assetType','fps-game')")&&fpsEditor.includes("form.append('gameId',id)"),'Images must be associated with the selected game');
assert(fpsEditor.includes("change(id,{image:result.url})"),'Uploaded cover must immediately appear in preview');
assert(fpsEditor.includes('onSave(normalized)'),'Game cover is persisted along with game settings');
assert(mediaBackend.includes('FPS_MEDIA_KEY')&&mediaBackend.includes("isFpsGame?'fps-games'"),'Server stores and serves FPS game covers');
assert(mediaBackend.includes('gameProfiles.some(game=>game.id===assetId)'),'Game uploads validate game ID');
assert(fpsRoster.includes("value.startsWith('/api/media?key=fps-games/')"),'Game image validator accepts uploaded cover URLs');
const fpsStyles=readFileSync(new URL('../app/fps-calculator-v2.css',import.meta.url),'utf8');
assert.ok(fpsStyles.includes('height:117px;min-height:117px;max-height:117px'),'Desktop game tiles keep a fixed height');
assert.ok(fpsStyles.includes('height:108px;min-height:108px;max-height:108px'),'Mobile game tiles keep a fixed height');
assert.ok(fpsStyles.includes('.skp-fps-v2-game-tile.selected{\n border-color:#ffe500'),'Selected game border does not change layout');

// Fixed FPS settings layout: switching native/FSR/DLSS cannot resize the
// ray tracing button or change the vertical position of results.
assert.ok(content.includes("skp-fps-v2-additional'+(canRt?' has-ray':'')"),'FPS additional settings grid stays mounted');
assert.ok(content.includes("safeUpscaling==='native'?' is-inactive':'')"),'Native upscaling mode leaves a reserved quality field');
assert.ok(content.includes("disabled={safeUpscaling==='native'}"),'Quality field is disabled when native rendering is selected');
assert.ok(!content.includes("{safeUpscaling!=='native'&&<div className=\"skp-fps-v2-extra-quality\""),'Quality selector must not be conditionally removed');
assert.ok(fpsStyles.includes('align-items:start;grid-auto-rows:74px;min-height:74px'),'Desktop additional settings reserve identical row heights');
assert.ok(fpsStyles.includes('width:100%;height:74px;min-height:74px;max-height:74px'),'Desktop ray-tracing button never stretches with technology selection');
assert.ok(fpsStyles.includes('grid-auto-rows:67px;gap:9px;min-height:67px'),'Mobile additional settings reserve identical row heights');
assert.ok(fpsStyles.includes('height:67px;min-height:67px;max-height:67px'),'Mobile ray-tracing button never stretches with technology selection');
console.log('FPS model tests passed: presets, resolutions, feature support, feature priority, ready PCs and configurator.');
