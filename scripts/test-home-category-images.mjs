import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import ts from 'typescript';

const shop=readFileSync(new URL('../app/shop.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../app/globals.css',import.meta.url),'utf8');
const compiled=ts.transpileModule(shop,{fileName:'app/shop.tsx',reportDiagnostics:true,
 compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}});
assert.equal(compiled.diagnostics?.filter(d=>d.category===ts.DiagnosticCategory.Error).length??0,0);

const images=[
 {category:'laptops',file:'category-laptops.jpg',bytes:314461,signature:[0xff,0xd8,0xff]},
 {category:'components',file:'category-components.webp',bytes:332866,signature:[0x52,0x49,0x46,0x46]},
 {category:'peripherals',file:'category-peripherals.jpg',bytes:249302,signature:[0xff,0xd8,0xff]}
];
for(const item of images){
 const path=new URL('../public/images/'+item.file,import.meta.url);
 const content=readFileSync(path);
 assert.equal(statSync(path).size,item.bytes,item.category+' photo must be the original user upload');
 assert.deepEqual([...content.slice(0,item.signature.length)],item.signature);
 if(item.file.endsWith('webp'))assert.equal(content.toString('ascii',8,12),'WEBP');
 assert.ok(shop.includes(item.category+":'/images/"+item.file+"'"),'Homepage category mapping: '+item.category);
 assert.ok(css.includes('.skp-category-photo-'+item.category),'Responsive artwork style: '+item.category);
}
assert.match(shop,/loading="lazy" decoding="async"/);
assert.match(shop,/href=\/images\/skp-reference.png/,'Unchanged fallback illustration for other site contexts');
assert.match(css,/\.category \.skp-category-photo\{[\s\S]*?object-fit:cover/);
assert.match(css,/\.category:has\(\.skp-category-photo\):after/,'Category label gradient remains readable');
assert.ok(!shop.includes("furniture:'/images/category-furniture"),'Furniture art remains unchanged');
console.log('SKP homepage categories use the three original uploaded images, full-res and category-matched.');
