import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

function load(relative){
 const source=readFileSync(new URL('../'+relative,import.meta.url),'utf8');
 const compiled=ts.transpileModule(source,{fileName:relative,reportDiagnostics:true,
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 assert.equal(compiled.diagnostics?.filter(d=>d.category===ts.DiagnosticCategory.Error).length??0,0);
 const exports={};
 runInNewContext(compiled.outputText,{exports,Set,Array,Math,Number,JSON});
 return exports;
}
const {seed}=load('lib/seed.ts');
const feature=load('lib/featured-monitor.ts');
const slides=load('lib/hero-slides.ts');
const monitor=seed.products.find(product=>product.id===feature.FEATURED_MONITOR_ID);
assert.ok(monitor,'The product must be in the seed catalog');
assert.equal(seed.catalogVersion,feature.CATALOG_VERSION);
assert.equal(monitor.name,'ASUS ROG Swift OLED PG27AQWP-G Edition 20');
assert.equal(monitor.category,'monitor');
assert.equal(monitor.price,160000);
assert.equal(monitor.stock,false,'Do not claim stock availability without confirmation');
assert.ok(monitor.image.startsWith('https://dlcdnwebimgs.asus.com/gain/'));
assert.equal(monitor.gallery.length,2,'Official front, angled and rear ASUS images');
assert.ok(monitor.gallery.every(src=>src.startsWith('https://dlcdnwebimgs.asus.com/gain/')));
assert.equal(monitor.specs.refresh,'540');
assert.equal(monitor.specs.resolution,'2560×1440');
assert.equal(monitor.specs.panel.includes('Tandem OLED'),true);

const before=seed.products.filter(product=>product.id!==monitor.id);
const after=feature.upgradeFeaturedMonitorProducts(before,monitor,7);
assert.equal(after.length,before.length+1,'Add to existing D1 catalog');
assert.equal(after.find(product=>product.id===monitor.id),monitor);
assert.equal(after[0],before[0],'Other existing products unchanged');
assert.equal(feature.upgradeFeaturedMonitorProducts(after,monitor,7).length,after.length,
 'Repeated GET does not duplicate');
assert.equal(feature.upgradeFeaturedMonitorProducts(before,monitor,8),before,
 'After saving version 8, intentional removal stays removed');

const alternate={...monitor,id:'hand-added-monitor',price:169000,stock:true,
 image:'https://example.com/custom-photo.webp',gallery:['https://example.com/custom-side.webp'],
 description:'Описание владельца магазина',specs:{...monitor.specs,refresh:'540'}};
const withManual=feature.upgradeFeaturedMonitorProducts([...before,alternate],monitor,7);
assert.equal(withManual.length,before.length+1,'Duplicate by model name is not inserted');
const repaired=withManual.find(product=>product.id===alternate.id);
assert.equal(repaired.price,160000,'Use user requested price');
assert.equal(repaired.stock,true,'Merchant inventory flag preserved');
assert.equal(repaired.image,alternate.image,'Owner upload preserved');
assert.equal(repaired.gallery[0],alternate.gallery[0],'Owner gallery preserved');
assert.equal(repaired.description,alternate.description,'Owner description preserved');
assert.equal(repaired.category,'monitor');

const allSlides=slides.defaultHeroSlides;
const linked=feature.linkFeaturedMonitorSlide(allSlides,after);
assert.equal(linked[3].href,'/product/'+monitor.id,'Slide points to product');
assert.equal(linked[0],allSlides[0],'All other slides stay identical');
const linkedOld=feature.linkFeaturedMonitorSlide(
 allSlides.map((item,i)=>i===3?{...item,href:'/catalog/monitor'}:item),
 withManual
);
assert.equal(linkedOld[3].href,'/product/hand-added-monitor','Existing user product ID is honored');
assert.equal(feature.linkFeaturedMonitorSlide(allSlides,before),allSlides,
 'No monitor does not mutate slides');

const route=readFileSync(new URL('../app/api/store/route.ts',import.meta.url),'utf8');
assert.match(route,/store\.catalogVersion\|\|0\)<CATALOG_VERSION/);
assert.match(route,/upgradeFeaturedMonitorProducts\(products,monitor,oldVersion\)/);
assert.match(route,/linkFeaturedMonitorSlide\(/);
assert.match(route,/catalogVersion:CATALOG_VERSION/);
const hero=readFileSync(new URL('../lib/hero-slides.ts',import.meta.url),'utf8');
assert.match(hero,/export const HERO_SLIDES_VERSION=3/,'Old saved slide layout receives the fix');
const css=readFileSync(new URL('../app/globals.css',import.meta.url),'utf8');
assert.match(css,/\.hero-carousel\.rog-oled-feature \.carousel-controls/);
console.log('ASUS OLED tests passed: 160,000 ₽ catalog item, real manufacturer images, D1 migration, CTA and saved slide.');
