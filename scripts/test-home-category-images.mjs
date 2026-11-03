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
assert.ok(shop.includes('href="/images/skp-reference.png"'),'Unchanged fallback illustration for other site contexts');
assert.match(css,/\.category \.skp-category-photo\{[\s\S]*?object-fit:cover/);
assert.match(css,/\.category:has\(\.skp-category-photo\):after/,'Category label gradient remains readable');
assert.ok(shop.includes("furniture:'/images/category-furniture.jpg'"),'Furniture category keeps its configured product photo');
const readyBannerPath=new URL('../public/images/skp-ready-pc-home-banner.webp',import.meta.url);
const readyBanner=readFileSync(readyBannerPath);
assert.ok(readyBanner.length>70000,'Ready-PC banner is stored locally in the repo at web quality');
assert.equal(readyBanner.toString('ascii',0,4),'RIFF','Ready-PC banner has a valid WebP file header');
assert.equal(readyBanner.toString('ascii',8,12),'WEBP','Ready-PC banner has a valid WebP container');
assert.ok(shop.includes('src="/images/skp-ready-pc-home-banner.webp"'),'Homepage ready-PC promo uses the supplied artwork');
assert.match(shop,/className="promo promo-banner promo-ready-pc"/,'Ready-PC homepage promo uses the full-bleed artwork layout');
assert.match(shop,/link\('\/pc',<>Смотреть сборки <ArrowRight size=\{17\}\/><\/>,'button light promo-ready-pc-link'\)/,
 'Ready-PC homepage banner keeps the catalog action');
assert.doesNotMatch(shop,/<LiveSectionPreview href="\/pc"/,
 'The ready-PC promo no longer hides the image behind an interactive page preview');
assert.ok(shop.includes("import './home-ready-pc-banner.css'"),'Responsive banner styles are loaded');
const bannerCss=readFileSync(new URL('../app/home-ready-pc-banner.css',import.meta.url),'utf8');
assert.match(bannerCss,/\.dual-promos \.promo-ready-pc-image\{[\s\S]*?width:100%;[\s\S]*?height:100%;[\s\S]*?object-fit:cover;/,
 'Desktop banner image fills the whole ready-PC block');
assert.match(bannerCss,/@media\(max-width:850px\)\{[\s\S]*?object-fit:contain;/,
 'Mobile shows the full artwork without cropping');

for(const banner of [
 {name:'skp-configurator-home-banner.webp',minBytes:100000,width:1600,height:600},
 {name:'skp-ready-pc-home-banner-mobile.webp',minBytes:75000,width:390,height:560},
 {name:'skp-configurator-home-banner-mobile.webp',minBytes:75000,width:390,height:560}
]){
 const asset=readFileSync(new URL('../public/images/'+banner.name,import.meta.url));
 assert.ok(asset.length>banner.minBytes,'Supplied banner included with sufficient image detail: '+banner.name);
 assert.equal(asset.toString('ascii',0,4),'RIFF','Valid WebP file: '+banner.name);
 assert.equal(asset.toString('ascii',8,12),'WEBP','Valid WebP container: '+banner.name);
 // All three supplied originals were converted without changing pixel values
 // to WebP lossless. Assert the intrinsic dimensions encoded in VP8L.
 const header=asset.indexOf(Buffer.from('VP8L'));
 assert.ok(header>=0,'Banner keeps lossless VP8L encoding: '+banner.name);
 const sizeBits=asset.readUInt32LE(header+9);
 assert.equal((sizeBits&0x3fff)+1,banner.width,'Correct banner width: '+banner.name);
 assert.equal(((sizeBits>>>14)&0x3fff)+1,banner.height,'Correct banner height: '+banner.name);
 assert.ok(shop.includes('/images/'+banner.name),'Banner file is referenced in homepage: '+banner.name);
}
assert.match(shop,/srcSet="\/images\/skp-ready-pc-home-banner-mobile\.webp"/,
 'Ready-PC mobile banner uses supplied vertical image');
assert.match(shop,/srcSet="\/images\/skp-configurator-home-banner-mobile\.webp"/,
 'Configurator mobile banner uses supplied vertical image');
assert.match(shop,/src="\/images\/skp-configurator-home-banner\.webp"/,
 'Configurator desktop banner uses supplied landscape image');
assert.match(shop,/className="promo promo-banner promo-configurator"/,
 'Configurator promo uses the same banner system as ready PCs');
assert.match(shop,/link\('\/configurator',<>Собрать свой ПК <ArrowRight size=\{17\}\/><\/>,'button light promo-ready-pc-link'\)/,
 'Configurator CTA still opens the builder');
assert.doesNotMatch(shop,/<LiveSectionPreview href="\/configurator"/,
 'Old interactive preview is replaced by the user-provided banner');
assert.match(shop,/<source media="\(max-width: 850px\)" srcSet="\/images\/skp-ready-pc-home-banner-mobile\.webp"/,
 'Responsive source automatically selects the phone image');
assert.match(bannerCss,/\.dual-promos \.promo\.promo-banner \.promo-banner-image\{[\s\S]*?width:100%;[\s\S]*?height:100%;[\s\S]*?object-fit:cover;/,
 'Desktop SKP banners fill their entire promo blocks');
assert.match(bannerCss,/aspect-ratio:390 \/ 560;/,
 'Phone banners preserve portrait proportions instead of cropping them');

console.log('SKP homepage banners use supplied desktop/mobile imagery with working category links.');
