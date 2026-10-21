import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const sidebar=readFileSync(new URL('../app/admin-sidebar.tsx',import.meta.url),'utf8');
const shop=readFileSync(new URL('../app/shop.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../app/admin-sidebar.css',import.meta.url),'utf8');
for(const [name,source] of [['admin-sidebar',sidebar],['shop',shop]]){
 const result=ts.transpileModule(source,{fileName:name+'.tsx',reportDiagnostics:true,
  compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}});
 assert.equal(result.diagnostics?.filter(d=>d.category===ts.DiagnosticCategory.Error).length??0,0,
  name+' syntax');
}
const labels=[
 ['contacts','Контакты и информация'],
 ['slides','Слайды'],
 ['products','Товары'],
 ['pcs','Готовые ПК'],
 ['orders','Заказы'],
 ['reviews','Отзывы']
];
for(const [id,label] of labels){
 assert.ok(sidebar.includes("id:'"+id+"',label:'"+label+"'"),'Sidebar includes '+label);
 assert.ok(shop.includes(id==='slides'?"adminSection!=='slides'":"adminSection==='"+id+"'"),'Content contains '+id);
}
assert.match(sidebar,/aria-label="Разделы админ-панели"/);
assert.match(sidebar,/aria-current=\{active===id\?'page':undefined\}/);
assert.match(sidebar,/aria-controls=\{'skp-admin-panel-'\+id\}/);
assert.match(sidebar,/type="button"/,'Navigation does not submit forms');
assert.match(sidebar,/onClick=\{\(\)=>onChange\(id\)\}/);
assert.match(sidebar,/productsCount:number/);
assert.match(sidebar,/pcsCount:number/);
assert.match(shop,/setAdminSection\(adminSectionFromQuery\(new URLSearchParams\(location\.search\)\.get\('section'\)\)\)/,'Direct links restore section');
assert.match(shop,/history\.replaceState\(history\.state,'','\/admin\?section='\+next\)/,'URL updates without reload');
assert.match(shop,/productsCount=\{data\.products\.filter\(p=>p\.category!=='pc'\)\.length\}/);
assert.match(shop,/pcsCount=\{data\.products\.filter\(p=>p\.category==='pc'\)\.length\}/);
assert.match(shop,/data\.products\.filter\(p=>adminSection==='pcs'\?p\.category==='pc':p\.category!=='pc'\)/,'Products and PCs are separate');
assert.match(shop,/category:adminSection==='pcs'\?'pc':'peripherals'/,'PC form defaults to ready PC type');
assert.match(shop,/<AdminHeroSlides slides=\{data\.heroSlides\}/,'Slider editor stays integrated');
assert.match(shop,/<AdminOrders\/>/,'Orders remains available');
assert.match(shop,/<AdminReviews\/>/,'Reviews remains available');
assert.match(shop,/onClick=\{\(\)=>setEditing\(normalizeProduct\(p\)\)\}/,'Product editor preserved');
assert.match(shop,/if\(confirm\('Удалить '\+p\.name\+'\?'\)\)/,'Delete product preserved');
assert.match(shop,/<AdminProductMedia/,'Product photo gallery remains integrated');
assert.match(shop,/editing\.category==='pc'&&<div className="admin-build-components">/,'Ready PC form retains editable components');
assert.match(shop,/hidden=\{adminSection!=='slides'\}/,'Slides remain mounted on tab changes to preserve unsaved draft');
assert.match(css,/position:sticky/,'Desktop sidebar stays visible while scrolling');
assert.match(css,/@media\(max-width:700px\)/,'Mobile navigation adapts');
assert.match(css,/overflow-x:auto/,'Mobile menu scrolls horizontally');
console.log('Admin navigation tests passed: six sections, independent products/PCs, preserved editors and responsive navigation.');
