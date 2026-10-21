import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

const hero=readFileSync(new URL('../app/hero-slider.tsx',import.meta.url),'utf8');
const editor=readFileSync(new URL('../app/admin-hero-slides.tsx',import.meta.url),'utf8');
const shop=readFileSync(new URL('../app/shop.tsx',import.meta.url),'utf8');
const route=readFileSync(new URL('../app/api/store/route.ts',import.meta.url),'utf8');
const media=readFileSync(new URL('../app/api/media/route.ts',import.meta.url),'utf8');
const css=readFileSync(new URL('../app/globals.css',import.meta.url),'utf8');
for(const [name,source] of [['hero',hero],['admin editor',editor]]){
 const result=ts.transpileModule(source,{
  compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX},
  fileName:name+'.tsx',reportDiagnostics:true
 });
 assert.equal(result.diagnostics?.filter(x=>x.category===ts.DiagnosticCategory.Error).length??0,0,name+' TSX syntax');
}
const source=readFileSync(new URL('../lib/hero-slides.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
 reportDiagnostics:true
});
assert.equal(compiled.diagnostics?.filter(x=>x.category===ts.DiagnosticCategory.Error).length??0,0);
const exports={};
runInNewContext(compiled.outputText,{exports,Set,Array,Math,Number,JSON});
const {defaultHeroSlides,validateHeroSlides,isHeroImageUrl,isHeroLink,moveHeroSlide,MAX_HERO_SLIDES}=exports;
assert.equal(defaultHeroSlides.length,3,'Three existing slides are initially preserved');
assert.equal(validateHeroSlides(defaultHeroSlides),true,'Existing slides validate');
assert.equal(defaultHeroSlides[0].primary,'Перейти');
assert.equal(defaultHeroSlides[0].href,'/product/logitech-pro-x3-superstrike-black');
assert.equal(defaultHeroSlides[0].image,'/images/pro-x3-magenta-hd.png');
assert.equal(defaultHeroSlides[0].image2,'/images/pro-x3-black-hd.png');
assert.equal(validateHeroSlides([]),true,'The admin may remove all slides');
assert.equal(validateHeroSlides(Array.from({length:MAX_HERO_SLIDES+1},(_,i)=>({...defaultHeroSlides[0],id:'slide-'+i}))),false);
assert.equal(validateHeroSlides([...defaultHeroSlides,defaultHeroSlides[0]]),false,'Duplicate ids forbidden');
assert.equal(validateHeroSlides([{...defaultHeroSlides[0],href:'javascript:alert(1)'}]),false,'External/script links rejected');
assert.equal(validateHeroSlides([{...defaultHeroSlides[0],href:'https://example.org'}]),false,'Only internal navigation');
assert.equal(validateHeroSlides([{...defaultHeroSlides[0],image:'data:image/svg+xml,a'}]),false);
assert.equal(validateHeroSlides([{...defaultHeroSlides[0],layout:'duo',image2:''}]),false,'Two-image layouts require second image');
assert.equal(validateHeroSlides([{...defaultHeroSlides[1],layout:'single',image:'/images/new.webp'}]),true,'New single-image slide can be saved');
assert.equal(isHeroImageUrl('/api/media?key=slides/hero-test/12345678-1234-4234-8234-123456789abc.webp'),true);
assert.equal(isHeroImageUrl('/api/media?key=slides/../x.webp'),false);
assert.equal(isHeroImageUrl('http://example.org/image.png'),false);
assert.equal(isHeroLink('//external-site.com'),false);
assert.equal(isHeroLink('/product/item-abc'),true);
assert.equal(moveHeroSlide(defaultHeroSlides,0,1)[0].id,defaultHeroSlides[1].id,'Move down');
assert.equal(moveHeroSlide(defaultHeroSlides,2,-1)[1].id,defaultHeroSlides[2].id,'Move up');
assert.equal(moveHeroSlide(defaultHeroSlides,0,-1)[0].id,defaultHeroSlides[0].id,'Out-of-bounds move is safe');
assert.equal(defaultHeroSlides[0].id,'skp-hero-logitech','Reorder does not mutate original input');

assert.match(hero,/export const HERO_AUTOPLAY_MS=5000\b/);
assert.match(hero,/window\.setTimeout\(\(\)=>setIndex\(current=>\(current\+1\)%slides\.length\),HERO_AUTOPLAY_MS\)/);
assert.match(hero,/window\.clearTimeout\(timeout\)/);
assert.match(hero,/onMouseEnter=\{\(\)=>setInteractionPaused\(true\)\}/);
assert.match(hero,/visibilitychange/);
assert.match(hero,/if\(!slide\)return null/,'All slides may be deleted safely');
assert.match(hero,/slides\.map\(\(s,i\)=>/,'Indicator count adapts to new slides');
assert.match(hero,/key=\{s\.id\}/,'Repeated destinations can have distinct slides');
assert.match(hero,/slide\.title\.split/,'Headline editable');
assert.match(hero,/slide\.description\.split/,'Description editable');
assert.match(hero,/slide\.layout==='logitech'/,'Existing Logitech custom layout maintained');
assert.match(hero,/slide\.layout==='rog'/,'Existing ROG custom layout maintained');
assert.match(hero,/slide\.layout==='premium'/,'Existing premium layout maintained');
assert.match(css,/Shared SKP hero contract: one height per viewport/);
for(const h of ['560px','500px','665px','700px'])assert.ok(css.includes('--skp-hero-height:'+h));
assert.match(css,/height:var\(--skp-hero-height\);\s*min-height:var\(--skp-hero-height\);\s*max-height:var\(--skp-hero-height\);/);

assert.match(shop,/<HeroSlider nav=\{nav\} items=\{data\.heroSlides\}/);
assert.match(shop,/<AdminHeroSlides slides=\{data\.heroSlides\}/);
assert.match(editor,/moveHeroSlide\(draft,index,-1\)/);
assert.match(editor,/moveHeroSlide\(draft,index,1\)/);
assert.match(editor,/draft\.filter\(s=>s\.id!==id\)/,'Delete slide');
assert.match(editor,/createHeroSlide\(\)/,'Add slide');
assert.match(editor,/validateHeroSlides\(draft\)/,'Check fields before saving');
assert.match(route,/heroSlides:store\.heroSlides\?\?defaultHeroSlides/,'Legacy catalog retains original slides');
assert.match(route,/validateHeroSlides\(d\.heroSlides\)/,'Server validates slider content');
assert.match(media,/assetType'\)==='slide'/,'Slide uploads supported in R2');
console.log('Hero tests passed: slide management, validation, defaults, image storage, responsive layout and autoplay.');
