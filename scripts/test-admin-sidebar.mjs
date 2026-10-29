import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const root=fileURLToPath(new URL('../',import.meta.url)),nativeRequire=createRequire(import.meta.url),cache=new Map();
function load(relative){
 const file=path.resolve(root,relative);
 if(cache.has(file))return cache.get(file).exports;
 const module={exports:{}};cache.set(file,module);
 const result=ts.transpileModule(readFileSync(file,'utf8'),{fileName:file,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}});
 assert.equal(result.diagnostics?.filter(d=>d.category===ts.DiagnosticCategory.Error).length??0,0,relative+' syntax');
 const require=name=>{
  if(name.endsWith('.css'))return {};
  if(name.startsWith('.')){
   const candidate=path.resolve(path.dirname(file),name);
   for(const ext of ['.tsx','.ts']){try{return load(path.relative(root,candidate+ext))}catch(error){if(error.code!=='ENOENT')throw error}}
  }
  return nativeRequire(name);
 };
 vm.runInNewContext(result.outputText,{module,exports:module.exports,require,console,URL,Intl},{filename:file});
 return module.exports;
}
const {default:Sidebar,adminSectionFromQuery,ADMIN_SECTIONS}=load('app/admin-sidebar.tsx');
const {inAdminProductSection,AdminProductTable}=load('app/admin-products.tsx');
const {seed}=load('lib/seed.ts');
assert.equal(adminSectionFromQuery(null),'dashboard');
assert.equal(adminSectionFromQuery('invalid'),'dashboard');
for(const {id} of ADMIN_SECTIONS)assert.equal(adminSectionFromQuery(id),id);
for(const p of seed.products){
 assert.equal(inAdminProductSection(p,'pcs'),p.category==='pc');
 assert.equal(inAdminProductSection(p,'laptops'),p.category==='laptops'||p.category==='laptop');
 if(p.category!=='pc'&&p.category!=='laptops'&&p.category!=='laptop'){
  assert(inAdminProductSection(p,'products'));
  assert(inAdminProductSection(p,'products',p.category));
 }
}
const noop=()=>{};
const menu=renderToStaticMarkup(React.createElement(Sidebar,{active:'dashboard',onChange:noop,productsCount:12,laptopsCount:3,pcsCount:2,search:'',onSearch:noop,onLogout:noop},'panel'));
assert(menu.includes('aria-current="page"'));
assert(menu.includes('Поиск по всем товарам'));
assert(menu.includes('Открыть магазин'));
const table=renderToStaticMarkup(React.createElement(AdminProductTable,{items:seed.products,onEdit:noop,onDelete:noop}));
assert.equal((table.match(/<tbody>[\s\S]*?<\/tbody>/)?.[0].match(/<tr>/g)||[]).length,Math.min(10,seed.products.length));
assert(table.includes('Редактировать'));
assert(table.includes('Открыть'));
assert(table.includes('Удалить'));
const empty=renderToStaticMarkup(React.createElement(AdminProductTable,{items:[],onEdit:noop,onDelete:noop}));
assert(empty.includes('Товары не найдены'));
const shop=readFileSync(path.join(root,'app/shop.tsx'),'utf8');
for(const component of ['AdminDashboard','AdminHeroSlides','AdminOrders','AdminReviews','AdminProductMedia','AdminBuildPicker'])assert(shop.includes('<'+component),component+' retained');
assert(shop.includes("confirm('Удалить '"),'Deletion still confirmed');
assert(shop.includes("hidden={adminSection!=='slides'}"),'Slide drafts retained');
const api=readFileSync(path.join(root,'app/api/orders/route.ts'),'utf8');
assert(api.indexOf('if(!await adminAuth(request))')<api.indexOf("searchParams.get('summary')"),'Summary requires admin authentication');
assert(api.includes("status='completed' THEN total ELSE 0"),'Only completed orders counted in amount');
const theme=readFileSync(path.join(root,'app/admin-dark-theme.css'),'utf8');
const brandsView=readFileSync(path.join(root,'app/admin-brands.tsx'),'utf8');
const desktopAndTabletTheme=theme.split('@media(max-width:700px)')[0];
assert(/body:has\(\.skp-admin-workspace\),\s*html:has\(\.skp-admin-workspace\)\{\s*background:#000;/.test(desktopAndTabletTheme),'Full-size admin document has black background');
assert(desktopAndTabletTheme.includes('--skp-admin-bg:#000;'),'Universal admin CSS token is pure black');
assert(desktopAndTabletTheme.includes('--skp-admin-panel:#101010;'),'Cards retain subtle separation from black workspace');
assert(desktopAndTabletTheme.includes('.skp-admin-workspace .skp-admin-work,')&&desktopAndTabletTheme.includes('.skp-admin-workspace .skp-admin-main{'),'Desktop/tablet admin work area is explicitly black');
assert(desktopAndTabletTheme.includes('.skp-admin-workspace .skp-admin-sidebar{background:#000;'),'Desktop/tablet sidebar uses pure black');
assert(desktopAndTabletTheme.includes('.skp-admin-workspace .skp-admin-topbar{background:#000;'),'Desktop/tablet topbar uses pure black');
assert(desktopAndTabletTheme.includes('.skp-admin-workspace .skp-admin-menu>.skp-admin-tab.active{background:#ffe500;'),'Yellow selected menu item stays the same');
assert(theme.includes('.skp-admin-workspace .skp-admin-global-search input,'),'Global admin search has its own seamless input rule');
assert(theme.includes('.skp-admin-workspace .skp-brands-search input[type="search"],'),'Brand search has its own seamless input rule');
assert(theme.includes('padding:0!important;')&&theme.includes('border:0!important;')&&theme.includes('background:transparent!important;'),'Search must not have a second framed input');
assert(theme.includes('.skp-admin-workspace .skp-admin-category-picker.skp-admin-category-always-visible{'),'Category picker has a non-framed container');
assert(theme.includes('.skp-admin-workspace .skp-admin-data-table tbody td{'),'Product table cells have consistent vertical alignment');
assert(theme.includes('object-position:center;')&&theme.includes('background:transparent;'),'Product thumbnails stay centered without background');
assert(brandsView.includes('brand.name.toLowerCase().includes(search.trim().toLowerCase())'),'Brand search filters case-insensitively and trims surrounding spaces');
assert(brandsView.includes('aria-label="Очистить поиск бренда"')&&brandsView.includes("onClick={()=>setSearch('')}"),'Brand search has a manual reset control');
const sidebarUI=readFileSync(path.join(root,'app/admin-sidebar.tsx'),'utf8');
assert(theme.includes('.skp-admin-topbar > .skp-admin-global-search:not(.mobile-expanded)'),'Collapsed mobile admin search is hidden with higher specificity');
assert(theme.includes('.skp-admin-topbar > .skp-admin-global-search.mobile-expanded'),'Mobile search only opens below the header after tapping search');
assert(theme.includes('.skp-admin-workspace .menu-open .skp-admin-mobile-logo'),'Centered mobile SKP logo does not show beneath menu scrim');
assert(theme.includes('.skp-admin-workspace .skp-admin-sidebar{\n  background:#000;'),'Mobile sidebar uses a genuinely black background');
assert(theme.includes('.skp-admin-workspace .skp-admin-topbar{\n  background:#000;'),'Mobile header uses a genuinely black background');
assert(sidebarUI.includes("onClick={()=>{setOpen(!open);setMobileSearch(false)}}"),'Opening menu closes mobile search');
assert(sidebarUI.includes("onClick={()=>{setMobileSearch(!mobileSearch);setOpen(false)}}"),'Opening mobile search closes menu');
console.log('Admin checks passed: navigation, product categories, table pagination, empty state, editor integrations and authenticated summary, seamless searches, black mobile header and menu, and transparent thumbnails.');
