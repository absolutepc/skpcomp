import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const sidebar=readFileSync(new URL('../app/admin-sidebar.tsx',import.meta.url),'utf8');
const shop=readFileSync(new URL('../app/shop.tsx',import.meta.url),'utf8');
const products=readFileSync(new URL('../app/admin-products.tsx',import.meta.url),'utf8');
const icons=readFileSync(new URL('../app/catalog-icons.ts',import.meta.url),'utf8');
const catalog=readFileSync(new URL('../lib/catalog.ts',import.meta.url),'utf8');
const css=readFileSync(new URL('../app/admin-sidebar.css',import.meta.url),'utf8');
const categoryCss=readFileSync(new URL('../app/admin-products.css',import.meta.url),'utf8');

for(const [name,source] of [['admin-sidebar',sidebar],['shop',shop],['admin-products',products]]){
 const result=ts.transpileModule(source,{fileName:name+'.tsx',reportDiagnostics:true,
  compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}});
 assert.equal(result.diagnostics?.filter(d=>d.category===ts.DiagnosticCategory.Error).length??0,0,name+' syntax');
}
const labels=[
 ['contacts','Контакты'],['slides','Слайды'],['products','Товары'],
 ['laptops','Ноутбуки'],['pcs','Готовые ПК'],['orders','Заказы'],['reviews','Отзывы']
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
assert.match(sidebar,/laptopsCount:number/);
assert.match(sidebar,/productsCount:number/);
assert.match(sidebar,/pcsCount:number/);
assert.match(shop,/setAdminSection\(adminSectionFromQuery\(new URLSearchParams\(location\.search\)\.get\('section'\)\)\)/,'Direct links restore section');
assert.match(shop,/history\.replaceState\(history\.state,'','\/admin\?section='\+next\)/,'URL updates without reload');
assert.match(shop,/path!=='\/admin'&&<div className="topline">/,'Storefront notice hidden in admin');
assert.match(shop,/path==='\/admin'\?<div className="skp-admin-header-tools">/,'Storefront navigation replaced by admin brand header');
assert.match(shop,/'skp-admin-home-link'/,'Admin retains route to storefront');
assert.match(shop,/productsCount=\{data\.products\.filter\(p=>inAdminProductSection\(p,'products'\)\)\.length\}/);
assert.match(shop,/laptopsCount=\{data\.products\.filter\(p=>inAdminProductSection\(p,'laptops'\)\)\.length\}/);
assert.match(shop,/pcsCount=\{data\.products\.filter\(p=>inAdminProductSection\(p,'pcs'\)\)\.length\}/);
assert.match(shop,/<AdminProducts\s+key=\{adminSection\}/,'Product, laptop and PC editors use one image-rich interface');
assert.match(shop,/onEdit=\{product=>setEditing\(normalizeProduct\(product\)\)\}/);
assert.match(shop,/onDelete=\{product=>\{if\(confirm\('Удалить '\+product\.name\+'\?'\)\)/,'Admin product deletion preserved');
assert.match(shop,/<AdminHeroSlides slides=\{data\.heroSlides\}/,'Slider editor remains integrated');
assert.match(shop,/<AdminOrders\/>/,'Orders remains available');
assert.match(shop,/<AdminReviews\/>/,'Reviews remains available');
assert.match(shop,/<AdminProductMedia/,'Product photo gallery remains integrated');
assert.match(shop,/editing\.category==='pc'&&<div className="admin-build-components">/,'Ready PCs retain full component editor');
assert.match(shop,/hidden=\{adminSection!=='slides'\}/,'Unsaved slider work survives tab changes');

const subcats=[...catalog.matchAll(/export const (components|peripherals):Record<string,string>=\{([^}]+)\}/g)];
assert.equal(subcats.length,2);
const categorySets=subcats.map(m=>[...m[2].matchAll(/([a-z]+):'[^']+'/g)].map(x=>x[1]));
assert.deepEqual(categorySets.map(a=>a.length),[8,8],'Exactly 8 component and 8 peripheral categories');
for(const category of categorySets.flat()){
 assert.match(icons,new RegExp('\\b'+category+':'),'Icon available for '+category);
}
assert.match(products,/const componentTypes=Object\.entries\(components\)/);
assert.match(products,/const peripheralTypes=Object\.entries\(peripherals\)/);
assert.match(products,/title="Комплектующие" items=\{componentsWithIcons\}/);
assert.match(products,/title="Периферия" items=\{peripheralsWithIcons\}/);
assert.match(products,/onClick=\{\(\)=>onChoose\(id\)\}/,'Category tiles open the selected category');
assert.match(products,/category==='other'/,'Other items remain accessible');
assert.match(products,/id:'furniture',label:'Компьютерная мебель'/,'Furniture stays manageable');
assert.match(products,/if\(section==='pcs'\)return p\.category==='pc'/,'Ready PCs stay separate');
assert.match(products,/if\(section==='laptops'\)return p\.category==='laptops'\|\|p\.category==='laptop'/,'Laptops stay separate');
assert.match(products,/return p\.category===category/,'Only selected product category appears');
assert.match(products,/getProductImages\(product\)\[0\]\|\|product\.image/,'Thumbnail uses primary product photo');
assert.match(products,/loading="lazy"/,'Product photos are lazy loaded');
assert.match(products,/onError=\{\(\)=>setFailed\(true\)\}/,'Broken images show a fallback');
assert.match(products,/onClick=\{\(\)=>onAdd\(newCategory\)\}/,'New products inherit the selected category');
assert.match(css,/position:sticky/,'Desktop sidebar stays visible while scrolling');
assert.match(css,/@media\(max-width:700px\)/,'Mobile navigation adapts');
assert.match(css,/overflow-x:auto/,'Mobile sidebar scrolls horizontally');
assert.match(css,/grid-template-columns:230px minmax\(0,1fr\)/,'Sidebar width does not depend on active panel content');
assert.match(css,/\.skp-admin-menu\{display:grid;grid-template-columns:minmax\(0,1fr\)/,'All desktop menu rows use one full-width column');
assert.match(css,/\.skp-admin-menu>\.skp-admin-tab\{width:100%;max-width:100%;min-width:0;box-sizing:border-box/,'Every desktop button stretches to sidebar width');
assert.match(css,/grid-template-columns:19px minmax\(0,1fr\) 26px 16px/,'Icons, text, badge and chevron have stable columns');
assert.match(css,/\.skp-admin-tab-count\.placeholder\{visibility:hidden\}/,'Invisible count still reserves badge space');
assert.match(css,/\.skp-admin-tab\.active \.skp-admin-tab-chevron\{visibility:visible\}/,'Active arrow does not change button geometry');
assert.match(css,/\.skp-admin-menu>\.skp-admin-tab\{flex:0 0 172px;width:172px/,'All mobile tabs share a uniform width');
assert.match(sidebar,/className="skp-admin-tab-count placeholder" aria-hidden="true"/,'Badge column exists for all sections');
assert.match(sidebar,/<ChevronRight className="skp-admin-tab-chevron" size=\{16\} aria-hidden="true"\/>/,'Arrow column exists for all sections');

assert.match(categoryCss,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/,'Desktop subcategories use an icon grid');
assert.match(categoryCss,/\.skp-admin-products > section\.skp-admin-category-group\{[\s\S]*?margin:0 0 22px;[\s\S]*?padding:0;/,'Admin category groups do not inherit storefront section padding');
assert.match(categoryCss,/\.skp-admin-products > section\.skp-admin-category-group:last-child\{margin-bottom:0\}/,'Last category group has no trailing gap');
assert.match(categoryCss,/@media\(max-width:550px\)/,'Small-screen list is adapted');
console.log('Admin tests passed: seven sections, 16 icon subcategories, laptops, image previews, clean header and preserved editors.');
