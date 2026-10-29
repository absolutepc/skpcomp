import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

// Load the real gallery and its storage-path dependency with TS transpilation.
const loaded=new Map();
function load(name){
 if(loaded.has(name))return loaded.get(name);
 const source=readFileSync(new URL('../lib/'+name+'.ts',import.meta.url),'utf8');
 const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 const exports={};loaded.set(name,exports);
 runInNewContext(outputText,{exports,require:dependency=>load(dependency.replace('./',''))});
 return exports;
}
const {getProductImages,updateProductGallery,isProductImageUrl,MAX_GALLERY_IMAGES}=load('product-gallery');
assert.equal(MAX_GALLERY_IMAGES,16);
const url='/api/media?key=products/special-white/12345678-1234-4234-8234-123456789abc.webp';
assert.equal(isProductImageUrl(url),true);
assert.equal(isProductImageUrl(url.replace('.webp','.png')),true,'Safari PNG gallery URL is accepted');
assert.equal(isProductImageUrl(url.replace('.webp','.jpg')),false,'Other formats are still rejected');
const folderImage='/api/media?key=components/motherboard/intel/LGA1700/DDR5/asus-z790/12345678-1234-4234-8234-123456789abc.webp';
assert.equal(isProductImageUrl(folderImage),true,'New category and socket folder is accepted');
assert.equal(isProductImageUrl('/api/media?key=components/cpu/amd/AM5/ryzen-7700/12345678-1234-4234-8234-123456789abc.png'),true);
assert.equal(isProductImageUrl(folderImage.replace('DDR5','DDR3')),false,'Unknown category folders are rejected');
assert.equal(isProductImageUrl(folderImage.replace('/DDR5/','/../')),false,'Traversal is rejected');
assert.equal(isProductImageUrl('/api/media?key=products/../other.webp'),false);
assert.equal(isProductImageUrl('javascript:alert(1)'),false);
assert.equal(isProductImageUrl('http://example.org/opaque.png'),false);
assert.equal(isProductImageUrl('/products/photos/rtx-5070.webp'),true);
assert.equal(isProductImageUrl('https://cdn.example.com/transparent.webp'),true);
const first={id:'one',image:'/products/photos/one.webp',gallery:[url,url]};
const second={id:'two',image:'/products/photos/two.webp',gallery:[]};
assert.equal(getProductImages(first).length,2);
const replacement=updateProductGallery(first,[url,'/products/photos/one.webp',url]);
assert.equal(replacement.image,url);
assert.equal(replacement.gallery.length,1);
assert.equal(first.image,'/products/photos/one.webp');
assert.equal(getProductImages(second)[0],'/products/photos/two.webp');
assert.equal(getProductImages(updateProductGallery(first,[])).length,0);
assert.equal(getProductImages(updateProductGallery(first,Array.from({length:40},(_,i)=>'https://site.com/'+i+'.webp'))).length,16);
// Exercise the browser conversion helper with mock canvas codecs. Safari can
// silently encode PNG even when image/webp was requested.
const uploadSource=readFileSync(new URL('../app/admin-product-media.tsx',import.meta.url),'utf8');
// Safari multipart requests must never include the original non-ASCII filename.
assert.match(uploadSource,/data\.append\('file',image,'skp-product-image\.'\+extension\)/,
 'Uploads use an ASCII-only filename; original filenames can contain Cyrillic or ™');
assert.doesNotMatch(uploadSource,/data\.append\('file',image,file\.name/,
 'Original non-ASCII names must not be passed into multipart FormData');
assert.match(uploadSource,/contentType\.includes\('application\/json'\)/,
 'Parse an API response as JSON only when its MIME type is JSON');
assert.match(uploadSource,/response\.status===404/,
 'Show real HTTP upload errors instead of the generic Safari SyntaxError');
const prepareStart=uploadSource.indexOf('async function transparentImage(');
const prepareEnd=uploadSource.indexOf('export default function AdminProductMedia',prepareStart);
assert(prepareStart>0&&prepareEnd>prepareStart,'Image preparation helper is present');
const helperSource=uploadSource.slice(prepareStart,prepareEnd)+'\nexports.prepare = transparentImage;';
const helperJS=ts.transpileModule(helperSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function testCanvas(encode,alpha=0){
 const ctx={
  clearRect(){},drawImage(){},
  getImageData(){const data=new Uint8ClampedArray(32);data.fill(255);for(let i=3;i<data.length;i+=4)data[i]=alpha;return {data}}
 };
 const canvas={width:0,height:0,getContext:()=>ctx,
  toBlob(callback,type){callback(encode(type,this))}
 };
 const sandbox={exports:{},document:{createElement:()=>canvas},createImageBitmap:async()=>({width:1200,height:1200,close(){}})};
 runInNewContext(helperJS,sandbox);
 return sandbox.exports.prepare;
}
const pngFallback=testCanvas(()=>({type:'image/png',size:1000}));
assert.equal((await pngFallback({type:'image/png',size:1024})).type,'image/png','Safari PNG fallback remains uploadable');
const webpCodec=testCanvas(()=>({type:'image/webp',size:900}));
assert.equal((await webpCodec({type:'image/png',size:1024})).type,'image/webp','WebP-capable browsers retain WebP');
const nullWebp=testCanvas(type=>type==='image/webp'?null:{type:'image/png',size:700});
assert.equal((await nullWebp({type:'image/png',size:1024})).type,'image/png','Null WebP conversion retries PNG');
await assert.rejects(
 ()=>testCanvas(()=>({type:'image/png',size:1000}),255)({type:'image/png',size:1024}),
 /непрозрачный фон/,'Opaque product photos are still rejected'
);
const mediaRoute=readFileSync(new URL('../app/api/media/route.ts',import.meta.url),'utf8');
assert.match(mediaRoute,/\(\?:webp\|png\)/,'Media API allows both PNG and WebP keys');
assert.match(mediaRoute,/file\.type!==mime/,'Media API checks MIME against PNG or WebP magic bytes');
assert.match(mediaRoute,/key\.endsWith\('\.png'\)/,'PNG response carries the right MIME');
console.log('Gallery tests passed: image ordering, duplicates, per-colour isolation and secure URLs, Safari PNG fallback and image validation.');
