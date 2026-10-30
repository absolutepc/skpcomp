import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

function load(module,dependencies={}){
 const source=readFileSync(new URL('../'+module,import.meta.url),'utf8');
 const {outputText,diagnostics}=ts.transpileModule(source,{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
  reportDiagnostics:true
 });
 assert.equal(diagnostics?.filter(d=>d.category===ts.DiagnosticCategory.Error).length??0,0,module+' syntax');
 const exports={};
 runInNewContext(outputText,{exports,require:(id)=>{
  if(!(id in dependencies))throw Error('Unexpected import '+id+' from '+module);
  return dependencies[id];
 },URL,URLSearchParams,Date,Math});
 return exports;
}
const carouselSpacing=load('lib/carousel-spacing.ts');
assert.equal(carouselSpacing.CONFIG_CAROUSEL_VISIBLE_GAP,30,'Perspective cards must have a larger visible gap');
for(const [width,nativeGap] of [[230,8],[260,14],[330,14]]){
 const left=carouselSpacing.carouselPose(-2,width,nativeGap);
 const nearLeft=carouselSpacing.carouselPose(-1,width,nativeGap);
 const middle=carouselSpacing.carouselPose(0,width,nativeGap);
 const nearRight=carouselSpacing.carouselPose(1,width,nativeGap);
 const right=carouselSpacing.carouselPose(2,width,nativeGap);
 assert.equal(left.angle,-38,'Outer left card tilts further inward');
 assert.equal(right.angle,38,'Outer right card tilts further inward');
 assert.equal(nearRight.angle,16,'Near card has a gentler perspective');
 assert.equal(middle.angle,0,'Center card must remain straight');
 assert.ok(Math.abs(left.center+right.center)<0.001,'Carousel is symmetric across the center');
 for(const [a,b] of [[middle,nearRight],[nearRight,right]]){
  const projectedGap=b.center-a.center-a.right-b.left;
  assert.ok(Math.abs(projectedGap-30)<0.001,'Perspective-projected right card spacing remains 30px');
 }
 for(const [a,b] of [[nearLeft,middle],[left,nearLeft]]){
  const projectedGap=b.center-a.center-a.right-b.left;
  assert.ok(Math.abs(projectedGap-30)<0.001,'Perspective-projected left card spacing remains 30px');
 }
}
const {seed}=load('lib/seed.ts');
const logic=load('lib/pc-builder.ts');
const saved=load('lib/saved-builds.ts',{'./pc-builder':logic});
const {analyzeBuild,candidateErrors,sanitizeBuildSelection}=logic;
const products=seed.products;
const byId=id=>products.find(p=>p.id===id);
const good={cpu:'ryzen-7500f',motherboard:'b650',ram:'ddr5-32',gpu:'rtx-5070',ssd:'ssd-1tb',psu:'psu-750',case:'case-white',cooler:'cooler'};
const goodAnalysis=analyzeBuild(good,products);
assert.equal(goodAnalysis.checked,8,'Eight main components recognized');
assert.equal(goodAnalysis.issues.filter(i=>i.severity==='error').length,0,'Known-compatible seed build');
assert.equal(goodAnalysis.power.knownLoads,true);
assert.ok(goodAnalysis.power.drawWatts>350&&goodAnalysis.power.drawWatts<550);
assert.ok(goodAnalysis.power.recommendedWatts>=goodAnalysis.power.drawWatts*1.35);
assert.ok(goodAnalysis.power.supplyWatts===750);
assert.equal(analyzeBuild({...good,cpu:'intel-i5'},products).issues.some(i=>i.code==='cpu-socket'),true,'Wrong socket detected');
assert.equal(analyzeBuild({...good,ram:'ddr4'},products).issues.some(i=>i.code.startsWith('ram-')&&i.severity==='error'),true,'DDR mismatch detected');
assert.equal(analyzeBuild({...good,cooler:undefined},products).issues.some(i=>i.code==='cooler-socket'),false);
assert.equal(candidateErrors('motherboard',byId('b760'),good,products).some(i=>i.code==='cpu-socket'),true,'Candidate filtering catches mismatches');
assert.equal(candidateErrors('psu',byId('psu-750'),good,products).length,0,'Adequate power supply');
const clone=(p,extra)=>({...p,specs:{...(p.specs||{}),...extra}});
const board=clone(byId('b650'),{ramSlots:'2',maxRam:'32',m2Slots:'1',form:'ATX'});
const chassis=clone(byId('case-white'),{boardForm:'mATX',gpuLength:'270',coolerHeight:'150'});
const gpu=clone(byId('rtx-5070'),{length:'310'});
const cooler=clone(byId('cooler'),{height:'162',socket:'LGA1700',tdp:'50'});
const memory=clone(byId('ddr5-32'),{capacity:'64',modules:'4'});
const restricted=products.map(p=>({b650:board,'case-white':chassis,'rtx-5070':gpu,cooler,'ddr5-32':memory}[p.id]||p));
const issues=analyzeBuild(good,restricted).issues.map(x=>x.code);
for(const code of ['cooler-socket','case-board','case-gpu','case-cooler','ram-slots','ram-capacity'])assert.ok(issues.includes(code),code+' detected');
const weakPsu={...byId('psu-750'),id:'weak-psu',watts:350,specs:{watts:'350'}};
const weakProducts=[...products,weakPsu];
assert.ok(analyzeBuild({...good,psu:'weak-psu'},weakProducts).issues.some(x=>x.code==='psu-capacity'));
assert.ok(candidateErrors('psu',weakPsu,good,weakProducts).some(x=>x.code==='psu-capacity'));
const unknown=products.map(p=>p.id==='rtx-5070'?{...p,watts:0,specs:{...p.specs,watts:''}}:p);
assert.equal(analyzeBuild(good,unknown).power.knownLoads,false,'Unknown GPU wattage is not assumed');
assert.equal(analyzeBuild(good,unknown).issues.some(x=>x.code==='psu-capacity'),false,'Do not block PSU on incomplete data');
const safe=sanitizeBuildSelection({cpu:'ryzen-7500f',gpu:'b650',untrusted:'x',motherboard:'b650'},products);
assert.equal(JSON.stringify(safe),JSON.stringify({cpu:'ryzen-7500f',motherboard:'b650'}));
const memoryStore=new Map();
const storage={getItem:key=>memoryStore.get(key)??null,setItem:(key,value)=>memoryStore.set(key,value)};
let list=saved.saveNamedBuild(storage,products,good,'  Игровой ПК  ');
assert.equal(list.length,1);assert.equal(list[0].name,'Игровой ПК');
list=saved.saveNamedBuild(storage,products,{...good,gpu:''},'Рабочий ПК');
assert.equal(list.length,2);
const existingId=list.find(x=>x.name==='Игровой ПК').id;
list=saved.saveNamedBuild(storage,products,good,'Игровой ПК');
assert.equal(list.length,2,'Same title updates rather than duplicates');
assert.equal(list.find(x=>x.name==='Игровой ПК').id,existingId);
assert.equal(saved.readSavedBuilds(storage,products).length,2);
const share=saved.getShareUrl(good,products,'https://skp.example');
assert.ok(share.startsWith('https://skp.example/configurator?build='));
const imported=saved.readSharedBuild(new URL(share).search,products);
assert.equal(JSON.stringify(imported),JSON.stringify(good));
assert.equal(saved.readSharedBuild('?build=%7B%22v%22%3A2%7D',products),null);
assert.equal(saved.readSharedBuild('?build=%7Bbad',products),null);
const legacyStore={getItem:key=>key==='skp-saved-build'?JSON.stringify(good):null,setItem(){}};
assert.equal(saved.readSavedBuilds(legacyStore,products)[0]?.id,'legacy');
const candidates=[byId('b760'),byId('b650')];
const grouped=logic.groupCandidateOptions('motherboard',candidates,{cpu:'ryzen-7500f'},products);
assert.equal(JSON.stringify(grouped.compatible.map(item=>item.product.id)),JSON.stringify(['b650']),
 'Compatible motherboard is presented first regardless of initial catalog order');
assert.equal(JSON.stringify(grouped.incompatible.map(item=>item.product.id)),JSON.stringify(['b760']),
 'Incompatible motherboard remains in the secondary group');
assert.equal(grouped.incompatible[0].issues.some(issue=>issue.code==='cpu-socket'),true,
 'Incompatible cards retain exact conflict reasons');
const allCompatible=logic.groupCandidateOptions('cpu',[byId('ryzen-7-7800x3d'),byId('ryzen-7500f')],
 {motherboard:'b650'},products);
assert.equal(JSON.stringify(allCompatible.compatible.map(item=>item.product.id)),JSON.stringify(['ryzen-7-7800x3d','ryzen-7500f']),
 'Ordering inside the compatible group keeps the preexisting price/name sort');
assert.equal(allCompatible.incompatible.length,0);
const allIncompatible=logic.groupCandidateOptions('motherboard',[byId('b760')],{cpu:'ryzen-7500f'},products);
assert.equal(allIncompatible.compatible.length,0);
assert.equal(allIncompatible.incompatible.length,1);
const iconSource=readFileSync(new URL('../app/catalog-icons.ts',import.meta.url),'utf8');
for(const [category,icon] of Object.entries({cpu:'Cpu',motherboard:'CircuitBoard',gpu:'Gpu',ram:'MemoryStick',
 ssd:'HardDrive',psu:'Zap',cooler:'Fan',case:'PcCase'})){
 assert.ok(iconSource.includes(category+':'+icon),category+' icon matches catalog');
}
const catalogUI=readFileSync(new URL('../app/catalog-page.tsx',import.meta.url),'utf8');
assert.match(catalogUI,/import \{categoryIcons\} from '\.\/catalog-icons'/);
const builderUI=readFileSync(new URL('../app/build-pages.tsx',import.meta.url),'utf8');
const shopUI=readFileSync(new URL('../app/shop.tsx',import.meta.url),'utf8');
assert.match(builderUI,/groupCandidateOptions\(step,options,selected,data\.products\)/);
assert.match(builderUI,/compatible\.map\(renderComponentOption\)/);
assert.match(builderUI,/incompatible\.map\(renderComponentOption\)/);
assert.match(builderUI,/aria-expanded=\{showIncompatible\}/);
assert.match(builderUI,/\['gpu','Видеокарта',categoryIcons\.gpu\]/);
assert.match(builderUI,/<BuildDiagnostics analysis=\{analysis\}/);
assert.match(builderUI,/<SavedBuildLibrary /);
assert.match(shopUI,/loaded=\{loaded\}/);

const layout=readFileSync(new URL('../app/configurator-visual.css',import.meta.url),'utf8');
const carouselLayout=readFileSync(new URL('../app/configurator-carousel.css',import.meta.url),'utf8');
assert.doesNotMatch(builderUI,/className="config-summary"/,
 'Duplicate lower selected-parts panel must not be rendered');
assert.match(builderUI,/<details className="config-build-details">/,
 'Detailed build composition and compatibility section stays available');
assert.match(builderUI,/problems\.length\?problems\.length\+' конфликт\(ов\)':money\(total\)/,
 'Existing composition heading displays total without redundant panel');
assert.match(builderUI,/const current=get\(step\)/,
 'Candidate price comparison uses the already selected category component');
assert.match(builderUI,/delta=current&&current\.id!==p\.id&&current\.price>0&&p\.price>0\?p\.price-current\.price:null/,
 'Alternative price is calculated as difference from selected item');
assert.match(builderUI,/delta>0\?'\+':delta<0\?'−':''/,
 'Positive and negative price differences use appropriate signs');
assert.match(builderUI,/delta!==null\?'Разница с выбранным':'Цена товара'/,
 'Price label clearly identifies differences and ordinary prices');
assert.match(builderUI,/disabled=\{conflict\|\|isChosen\}/,
 'Already selected parts and incompatible products cannot be added again');
assert.match(builderUI,/const choose=\(p:Product\)=>setPendingChoice\(\{step,product:p\}\)/,
 'Card click creates pending choice instead of instantly selecting it');
assert.match(builderUI,/const chooseOs=\(id:string\)=>setPendingChoice\(\{step:'os',osId:id\}\)/,
 'Operating-system selection also needs confirmation');
assert.match(builderUI,/const confirmChoice=\(advance:boolean\)=>\{/,
 'Both staying and advancing after confirmation are supported');
const confirmation=builderUI.slice(builderUI.indexOf('const confirmChoice='),builderUI.indexOf('const pendingCurrent='));
assert.match(confirmation,/setSelected\(nextSelection\)/,
 'Build changes only inside explicit confirmation handler');
assert.match(confirmation,/if\(!advance\)return;/,
 'No automatic transition when choosing to stay in current category');
assert.match(confirmation,/candidateErrors\(chosenStep,product,selected,data\.products\)/,
 'Compatibility is rechecked before applying confirmed choice');
assert.match(builderUI,/role="dialog" aria-modal="true" aria-labelledby="skp-config-confirm-title"/,
 'Selection confirmation is an accessible modal dialog');
for(const label of ['Отмена','Подтвердить и остаться','Подтвердить и продолжить'])
 assert.ok(builderUI.includes(label),'Confirmation must provide action: '+label);
assert.match(layout,/\.config-page\.config-studio \.component-steps\{\s*border:0;/,
 'Upper navigation divider lines remain removed');
assert.match(layout,/\.config-confirm-backdrop\{\s*position:fixed;/,
 'Only confirmation modal overlays the viewport, not selected parts');
assert.doesNotMatch(layout,/\.config-dock\{position:fixed/,
 'Obsolete fixed component overlay styles remain removed');
assert.doesNotMatch(layout,/\.config-page\.config-studio \.config-summary\{/,
 'Duplicate lower summary layout styles are removed');
assert.doesNotMatch(carouselLayout,/config-dock/,
 'Outdated fixed dock overrides remain removed');

console.log('Configurator tests passed: compatibility grouping, shared icons, sockets, memory, dimensions, PSU, saved builds, share links and integration.');
