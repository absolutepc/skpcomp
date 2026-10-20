import type {Product} from './seed';

// Image ordering is per product ID. Each colour variant is a separate product.
export const MAX_GALLERY_IMAGES=16;
export function getProductImages(product:Pick<Product,'image'|'gallery'>):string[]{
 const entries=[product.image,...(Array.isArray(product.gallery)?product.gallery:[])];
 return [...new Set(entries.filter((url):url is string=>typeof url==='string'&&url.trim().length>0))].slice(0,MAX_GALLERY_IMAGES);
}
export function updateProductGallery<T extends Product>(product:T,images:string[]):T{
 const unique=[...new Set(images.filter(Boolean))].slice(0,MAX_GALLERY_IMAGES);
 return {...product,image:unique[0]||'',gallery:unique.slice(1)};
}
export const MEDIA_PATH=/^\/api\/media\?key=products\/[a-zA-Z0-9_-]{1,90}\/[0-9a-f-]{36}\.webp$/;
export function isProductImageUrl(url:string):boolean{
 return url===''||/^https:\/\//.test(url)||/^\/products\/(?:cpu|headphones)\/[a-z0-9-]+\.svg$/.test(url)||/^\/products\/photos\/[a-z0-9-]+\.webp$/.test(url)||MEDIA_PATH.test(url);
}
