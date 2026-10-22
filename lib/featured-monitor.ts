import type {Product} from './seed';
import type {HeroSlide} from './hero-slides';

export const FEATURED_MONITOR_ID='asus-rog-swift-oled-pg27aqwp-g-edition-20';
export const CATALOG_VERSION=9;

export function isFeaturedMonitor(product:Pick<Product,'id'|'name'>):boolean{
 return product.id===FEATURED_MONITOR_ID||/PG27AQWP[\s-]?G/i.test(product.name);
}
/** Add the monitor to existing D1 catalogs without losing merchant-entered data. */
export function upgradeFeaturedMonitorProducts(products:Product[],official:Product,version:number):Product[]{
 if(version>=8)return products;
 const existing=products.find(isFeaturedMonitor);
 if(!existing)return [...products,official];
 return products.map(product=>product!==existing?product:{
  ...product,
  category:'monitor',price:160000,
  image:product.image||official.image,
  gallery:product.gallery?.length?product.gallery:official.gallery,
  brand:product.brand||official.brand,
  description:product.description||official.description,
  specs:{...official.specs,...product.specs}
 });
}
/** The slide opens the actual card, including when an earlier admin card used another ID. */
export function linkFeaturedMonitorSlide(slides:HeroSlide[],products:Product[]):HeroSlide[]{
 const monitor=products.find(isFeaturedMonitor);
 if(!monitor)return slides;
 const href='/product/'+monitor.id;
 return slides.map(slide=>{
  if(!(/PG27AQWP[\s-]?G/i.test(slide.title+' '+slide.label)))return slide;
  return slide.href===href?slide:{...slide,href};
 });
}
