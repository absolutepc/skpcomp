import {env} from 'cloudflare:workers';
import {seed} from './seed';
import {upgradeLogitechGamingMice} from './logitech-mouse-upgrade';
import {upgradeReadyPcDemos} from './ready-pc-demos';
import {productPhotos} from './product-photos';
import {upgradeRogSwiftOledSlide,HERO_SLIDES_VERSION,upgradeComputerHeroImage,COMPUTER_HERO_IMAGE_VERSION,swapSecondAndFourthHeroSlides,HERO_SLIDE_ORDER_VERSION} from './hero-slides';
import {CATALOG_VERSION,FEATURED_MONITOR_ID,upgradeFeaturedMonitorProducts,linkFeaturedMonitorSlide} from './featured-monitor';
import {addRogProducts,groupRogMonitors} from './rog-catalog';
const E=env as unknown as {DB:D1Database;ADMIN_PASSWORD:string};
// A fresh local D1 database has no tables until its first request.
async function ensureShop(){await E.DB.prepare('CREATE TABLE IF NOT EXISTS shop (id TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)').run()}
export async function readCatalog(){
 await ensureShop();
 const row=await E.DB.prepare('SELECT value FROM shop WHERE id=?').bind('catalog').first<{value:string}>();
 const store=upgradeReadyPcDemos(row?JSON.parse(row.value) as typeof seed:seed);
 // Upgrade legacy catalogs without replacing prices, availability, contacts or admin changes.
 // The version is saved along with the catalog on the next admin edit, so intentional deletions stay deleted.
 if(row&&(store.catalogVersion||0)<CATALOG_VERSION){
  const oldVersion=store.catalogVersion||0;
  let products=[...store.products];
  // Upgrade older catalog snapshots first, preserving any merchant-edited prices,
  // stock flags, descriptions, images and unrelated product records.
  if(oldVersion<1){
   const white=seed.products.find(p=>p.id==='mouse')!;
   const black=seed.products.find(p=>p.id==='logitech-pro-x-superlight-2-black')!;
   products=products.map(p=>p.id==='mouse'&&p.name.toLowerCase().includes('superlight 2')?{
    ...p,name:p.name==='Logitech G Pro X Superlight 2'?white.name:p.name,category:'mouse',image:p.image||white.image,
    variantGroup:white.variantGroup,colorHex:white.colorHex,
    specs:{...white.specs,...p.specs,color:'Белый'}
   }:p);
   if(!products.some(p=>p.id==='mouse'))products.push(white);
   if(!products.some(p=>p.id===black.id))products.push(black);
  }
  // Version 2: three separate Logitech SUPERSTRIKE products.
  // If the catalog is already at version 2, respect any deletions made in admin.
  if(oldVersion<2){
   const newIds=['logitech-pro-x2-superstrike','logitech-pro-x3-superstrike-black','logitech-pro-x3-superstrike-pink'];
   for(const id of newIds){
    if(!products.some(p=>p.id===id)){
     const product=seed.products.find(p=>p.id===id);
     if(product)products.push(product);
    }
   }
  }
  // Version 3: use transparent original manufacturer images only for old default URLs.
  // Keep any photos uploaded by the merchant instead of overwriting them.
  const originalImages={"mouse":"https://www.maxgaming.com/bilder/artiklar/28011.jpg?m=1692975886","logitech-pro-x-superlight-2-black":"https://www.maxgaming.fi/bilder/artiklar/28010.jpg?m=1692971556","logitech-pro-x2-superstrike":"https://s7ap1.scene7.com/is/image/krisshop/ENLOGIG0043_detailImage01?fmt=webp","logitech-pro-x3-superstrike-black":"https://media.power-cdn.net/images/h-8754643e062d1e8c8928769bb49c09e3/products/4526616/4526616_4_1200x1200_w_g.jpg","logitech-pro-x3-superstrike-pink":"https://www.noelleeming.co.nz/on/demandware.static/-/Sites-nlg-master-catalog/default/dwba7d59af/images/hi-res/86/06/N256740_00.jpg"};
  const transparentImages={"mouse":"https://resource.logitechg.com/w_544%2Ch_466%2Car_7%3A6%2Cc_pad%2Cq_auto%2Cf_auto%2Cdpr_1.0/d_transparent.gif/content/dam/gaming/en/products/pro-x-superlight-2/new-gallery-assets-2025/pro-x-superlight-2-mice-top-angle-white-gallery-1.png","logitech-pro-x-superlight-2-black":"https://resource.logitechg.com/w_544%2Ch_466%2Car_7%3A6%2Cc_pad%2Cq_auto%2Cf_auto%2Cdpr_1.0/d_transparent.gif/content/dam/gaming/en/products/pro-x-superlight-2/new-gallery-assets-2025/pro-x-superlight-2-mice-top-angle-black-gallery-1.png","logitech-pro-x2-superstrike":"https://resource.logitechg.com/w_544%2Ch_466%2Car_7%3A6%2Cc_pad%2Cq_auto%2Cf_auto%2Cdpr_1.0/d_transparent.gif/content/dam/gaming/en/products/pro-x2-superstrike-pdp/2026/pro-x2-superstrike-top-angle-lifestyle-gallery-2.png","logitech-pro-x3-superstrike-black":"https://resource.logitechg.com/w_544%2Ch_466%2Car_7%3A6%2Cc_pad%2Cq_auto%2Cf_auto%2Cdpr_1.0/d_transparent.gif/content/dam/gaming/en/products/pro-x3-superstrike-pdp/gallery/pro-x3-superstrike-mouse-midnight-black-top-angle-gallery-1.png","logitech-pro-x3-superstrike-pink":"https://resource.logitechg.com/w_544%2Ch_466%2Car_7%3A6%2Cc_pad%2Cq_auto%2Cf_auto%2Cdpr_1.0/d_transparent.gif/content/dam/gaming/en/products/pro-x3-superstrike-pdp/gallery/pro-x3-superstrike-mouse-magenta-eclipse-top-angle-gallery-1.png"};
  const oldX2Name='Logitech G PRO X2 SUPERSTRIKE — белая / чёрные кнопки';
  const oldX2Description='Беспроводная LIGHTSPEED · HITS · Lunar Eclipse · белый корпус, чёрные кнопки';
  const correctedX2=seed.products.find(p=>p.id==='logitech-pro-x2-superstrike')!;
  products=products.map(p=>{
   const image=transparentImages[p.id as keyof typeof transparentImages];
   const before=originalImages[p.id as keyof typeof originalImages];
   if(!image)return p;
   const updated={...p,image:!p.image||p.image===before?image:p.image};
   if(p.id==='logitech-pro-x2-superstrike'){
    return {...updated,name:p.name===oldX2Name?correctedX2.name:p.name,
     description:p.description===oldX2Description?correctedX2.description:p.description,
     specs:{...p.specs,color:p.specs?.color==='Белый / чёрные кнопки'?'Белый':p.specs?.color||'Белый'}};
   }
   return updated;
  });
  // Version 4: add Ryzen 5 7500X3D, Ryzen 7 7800X3D and Ryzen 7 9800X3D.
  // Keep all existing catalog entries and custom edits made by the shop owner.
  if(oldVersion<4){
   const ryzenIds=['ryzen-5-7500x3d','ryzen-7-7800x3d','ryzen-7-9800x3d'];
   for(const id of ryzenIds){
    if(!products.some(p=>p.id===id)){
     const cpu=seed.products.find(p=>p.id===id);
     if(cpu)products.push(cpu);
    }
   }
  }
  // Version 5: self-hosted, transparent product art. Do not overwrite merchant uploads.
  if(oldVersion<5){
   const oldCpuImages={"ryzen-7500f":"","intel-i5":"","ryzen-5-7500x3d":"https://mfcomputersolution.com/cdn/shop/files/7500x3d-1.webp?v=1772874700","ryzen-7-7800x3d":"https://gitec.ge/images/thumbs/0074970_7-7800x3d-tray_550.webp","ryzen-7-9800x3d":"https://quadrastores.com/cdn/shop/files/80684df4abbc93ab0000cd5c02481695.png?v=1756154488&width=1445"};
   products=products.map(p=>{
    const expected=oldCpuImages[p.id as keyof typeof oldCpuImages];
    if(expected===undefined)return p;
    const fallback=seed.products.find(x=>x.id===p.id);
    if(!fallback)return p;
    // Update empty and previous default sources; preserve custom product pictures.
    if(!p.image||p.image===expected)return {...p,image:fallback.image};
    return p;
   });
  }
  // Version 6: add Logitech G PRO X2/X3 LIGHTSPEED headsets, one URL per color.
  // Existing shop items, edited prices, contacts and manually set images remain intact.
  if(oldVersion<6){
   const headsetIds=['logitech-pro-x2-lightspeed-black','logitech-pro-x2-lightspeed-white','logitech-pro-x2-lightspeed-pink',
    'logitech-pro-x3-lightspeed-black','logitech-pro-x3-lightspeed-white','logitech-pro-x3-lightspeed-pink'];
   for(const id of headsetIds){
    if(!products.some(p=>p.id===id)){
     const headset=seed.products.find(p=>p.id===id);
     if(headset)products.push(headset);
    }
   }
  }
  // Version 7: local model-accurate photos for existing non-mouse products.
  // Never replace store-owner uploaded images, prices, stock or descriptions.
  if(oldVersion<7){
   products=products.map(p=>{
    const photo=p.category!=='mouse'?productPhotos[p.id]:undefined;
    if(!photo)return p;
    const legacySvg=/^\/products\/(?:cpu|headphones)\/[^?#]+\.svg(?:[?#].*)?$/.test(p.image||'');
    return !p.image||legacySvg?{...p,image:photo}:p;
   });
  }
  // Version 8: showcase the ASUS ROG Swift OLED PG27AQWP-G Edition 20.
  // Existing admin product records, stock settings and uploaded art are preserved.
  if(oldVersion<8){
   const monitor=seed.products.find(p=>p.id===FEATURED_MONITOR_ID)!;
   products=upgradeFeaturedMonitorProducts(products,monitor,oldVersion);
  }
  products=addRogProducts(products,seed.products,oldVersion);
  products=groupRogMonitors(products,oldVersion);
  // Version 11: owner-approved Logitech prices and verified mouse specs.
  // Preserve inventory, uploaded images, color links and unrelated products.
  products=upgradeLogitechGamingMice(products,seed.products,oldVersion);
  // The next successful admin save persists the new catalog version in D1.
  // Once saved, intentionally deleted products are not automatically recreated.
  const slides=linkFeaturedMonitorSlide(
   upgradeComputerHeroImage(upgradeRogSwiftOledSlide(store.heroSlides,store.heroSlidesVersion),store.computerHeroImageVersion),products);
  const orderedSlides=store.heroSlides?
   swapSecondAndFourthHeroSlides(slides,store.heroSlideOrderVersion):slides;
  return ({...store,products,catalogVersion:CATALOG_VERSION,
   heroSlides:orderedSlides,heroSlidesVersion:HERO_SLIDES_VERSION,
   computerHeroImageVersion:COMPUTER_HERO_IMAGE_VERSION,
   heroSlideOrderVersion:HERO_SLIDE_ORDER_VERSION});
 }
 const latestSlides=linkFeaturedMonitorSlide(
  upgradeComputerHeroImage(upgradeRogSwiftOledSlide(store.heroSlides,store.heroSlidesVersion),store.computerHeroImageVersion),store.products);
 // Swap the currently stored 2nd/4th entries only once. Subsequent admin
 // reorders are preserved when the version is persisted with the next save.
 const orderedSlides=store.heroSlides?
  swapSecondAndFourthHeroSlides(latestSlides,store.heroSlideOrderVersion):latestSlides;
 return ({...store,heroSlides:orderedSlides,
  heroSlidesVersion:HERO_SLIDES_VERSION,
  computerHeroImageVersion:COMPUTER_HERO_IMAGE_VERSION,
  heroSlideOrderVersion:HERO_SLIDE_ORDER_VERSION});
}
