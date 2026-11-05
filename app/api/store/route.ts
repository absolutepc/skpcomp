import {authorized as auth,login,logout} from '../../../lib/admin-session';
import {readCatalog} from '../../../lib/read-catalog';
import {env} from 'cloudflare:workers';
import {categoryBrands} from '../../../lib/product-brands';
import {validateFpsGames} from '../../../lib/fps-game-catalog';
import {buildComponentFields} from '../../../lib/build-components';
import {maxProductSpecFields} from '../../../lib/catalog';
import {isProductImageUrl,MAX_GALLERY_IMAGES} from '../../../lib/product-gallery';
import {validateHeroSlides} from '../../../lib/hero-slides';
const E=env as unknown as {DB:D1Database;ADMIN_PASSWORD:string};
// A fresh local D1 database has no tables until its first request.
export async function GET(){return Response.json(await readCatalog(),{headers:{'Cache-Control':'no-store'}})}
export async function POST(r:Request){if(r.headers.get('origin')!==new URL(r.url).origin)return new Response('Forbidden',{status:403});const b=await r.json() as any;
if(b.action==='login')return login(r,b.password);
if(b.action==='logout')return logout(r);
if(!await auth(r))return Response.json({error:'Войдите в административную панель'},{status:401});if(b.action==='check')return Response.json({ok:true});
const d=b.data;if(!d||!Array.isArray(d.products)||d.products.length>1000)return Response.json({error:'Некорректный каталог'},{status:400});
if(d.brands!==undefined){
 if(!Array.isArray(d.brands)||d.brands.length>120)return Response.json({error:'Некорректный справочник брендов'},{status:400});
 const ids=new Set<string>(),names=new Set<string>();
 for(const brand of d.brands){
  if(!brand||typeof brand!=='object'||typeof brand.id!=='string'||!/^brand-[a-z0-9-]{1,80}$/.test(brand.id)||
   typeof brand.name!=='string'||!brand.name.trim()||brand.name.length>80||
   typeof brand.logo!=='string'||brand.logo.length>2048||
   (brand.logo&&!/^https:\/\/[^\s]+$/.test(brand.logo)&&
    !/^\/api\/media\?key=brands\/[a-zA-Z0-9_-]{1,90}\/[0-9a-f-]{36}\.(?:png|webp)$/.test(brand.logo)&&
    !/^\/images\/[a-zA-Z0-9/_-]+\.(?:png|webp|jpg|jpeg|svg)$/.test(brand.logo))||
   !brand.categories||typeof brand.categories!=='object'||Array.isArray(brand.categories))
   return Response.json({error:'Проверьте название, ID и логотип бренда'},{status:400});
  const name=brand.name.trim().toLocaleLowerCase('ru');
  if(ids.has(brand.id)||names.has(name))return Response.json({error:'Названия и ID брендов должны быть уникальными'},{status:400});
  ids.add(brand.id);names.add(name);
  const entries=Object.entries(brand.categories);
  if(!entries.length||entries.length>Object.keys(categoryBrands).length)return Response.json({error:'Выберите категории бренда'},{status:400});
  for(const [category,raw] of entries){
   if(!Object.hasOwn(categoryBrands,category)||!Array.isArray(raw)||raw.length>50||
    raw.some((series:unknown)=>typeof series!=='string'||!series.trim()||series.length>90)||
    new Set(raw.map((series:string)=>series.toLocaleLowerCase('ru'))).size!==raw.length)
    return Response.json({error:'Некорректные серии или категории бренда'},{status:400});
  }
 }
}
if(!validateHeroSlides(d.heroSlides))return Response.json({error:'Проверьте настройки слайдов, ссылки и изображения. Максимум 12 слайдов.'},{status:400});
if(!validateFpsGames(d.fpsGames))return Response.json({error:'Проверьте список игр FPS: названия, изображения, порядок и доступность.'},{status:400});
if(d.products.some((p:any)=>!p.id||!p.name||!Number.isFinite(p.price)||p.price<0||!isProductImageUrl(p.image)))return Response.json({error:'Проверьте названия, цены и ссылки фотографий'},{status:400});
if(d.products.some((p:any)=>p.gallery!==undefined&&(
 !Array.isArray(p.gallery)||p.gallery.length>=MAX_GALLERY_IMAGES||
 p.gallery.some((url:unknown)=>typeof url!=='string'||!url||!isProductImageUrl(url))||
 new Set([p.image,...p.gallery]).size!==1+p.gallery.length
)))return Response.json({error:'Проверьте фотографии галереи: максимум 16, без дубликатов'},{status:400});
if(d.products.some((p:any)=>p.specs!==undefined&&(!p.specs||typeof p.specs!=='object'||Array.isArray(p.specs)||Object.keys(p.specs).length>maxProductSpecFields(typeof p.category==='string'?p.category:'')||Object.entries(p.specs).some(([k,v])=>k.length>50||typeof v!=='string'||v.length>300))))return Response.json({error:'Проверьте характеристики товаров'},{status:400});
const validBuildFields=new Set<string>(buildComponentFields.map(field=>field.key));
if(d.products.some((p:any)=>p.buildComponents!==undefined&&(
 !p.buildComponents||typeof p.buildComponents!=='object'||Array.isArray(p.buildComponents)||
 Object.keys(p.buildComponents).length>buildComponentFields.length||
 Object.entries(p.buildComponents).some(([key,value])=>!validBuildFields.has(key)||typeof value!=='string'||value.length>300)
)))return Response.json({error:'Проверьте комплектацию ПК'},{status:400});
if(d.products.some((p:any)=>p.buildExtras!==undefined&&(
 !Array.isArray(p.buildExtras)||p.buildExtras.length>20||
 p.buildExtras.some((part:any)=>!part||typeof part!=='object'||typeof part.name!=='string'||part.name.length>80||typeof part.value!=='string'||part.value.length>300)
)))return Response.json({error:'Проверьте дополнительные комплектующие'},{status:400});
if(d.products.some((p:any)=>(p.variantGroup!==undefined&&(typeof p.variantGroup!=='string'||p.variantGroup.length>80))||(p.colorHex!==undefined&&(typeof p.colorHex!=='string'||!/^#[0-9a-fA-F]{6}$/.test(p.colorHex)))))return Response.json({error:'Проверьте группу вариантов и HEX-код цвета'},{status:400});
if(d.instagram&&!/^https:\/\/(www\.)?instagram\.com\//.test(d.instagram))return Response.json({error:'Введите ссылку Instagram'},{status:400});if(d.whatsapp&&!/^\d{10,15}$/.test(d.whatsapp))return Response.json({error:'Номер WhatsApp: 10–15 цифр без плюса'},{status:400});
await E.DB.prepare('CREATE TABLE IF NOT EXISTS shop (id TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)').run();
const revision=crypto.randomUUID();
const expected=d.revision??'';
d.revision=revision;
const changed=await E.DB.prepare("INSERT INTO shop(id,value) SELECT 'catalog',? WHERE ?='' OR EXISTS(SELECT 1 FROM shop WHERE id='catalog') ON CONFLICT(id) DO UPDATE SET value=excluded.value WHERE COALESCE(json_extract(shop.value,'$.revision'),'')=?").bind(JSON.stringify(d),expected,expected).run();
if(!changed.meta.changes)return Response.json({error:'Каталог изменился. Обновите страницу и повторите правку.'},{status:409});
return Response.json({ok:true,revision});}
