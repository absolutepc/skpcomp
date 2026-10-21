export const HERO_LAYOUTS=['logitech','premium','rog','single','duo'] as const;
export type HeroLayout=typeof HERO_LAYOUTS[number];
export type HeroSlide={
 id:string;label:string;eyebrow:string;title:string;highlightLine:number;description:string;
 primary:string;href:string;secondary:string;secondHref:string;
 layout:HeroLayout;image:string;image2:string;caption:string;caption2:string;
};
export const MAX_HERO_SLIDES=12;
export const defaultHeroSlides:HeroSlide[]=[
 {id:'skp-hero-logitech',label:'Новинка в SKP — Logitech G Pro X3 Superstrike',
 eyebrow:'НОВИНКА В SKP · LOGITECH G',title:'LOGITECH G\nPRO X3\nSUPERSTRIKE',highlightLine:1,
 description:'Logitech G PRO X3 SUPERSTRIKE\nв цветах Magenta Eclipse и Midnight Black.',
 primary:'Перейти',href:'/product/logitech-pro-x3-superstrike-black',secondary:'Весь каталог',secondHref:'/catalog/all',
 layout:'logitech',image:'/images/pro-x3-magenta-hd.png',image2:'/images/pro-x3-black-hd.png',
 caption:'MAGENTA ECLIPSE',caption2:'MIDNIGHT BLACK'},
 {id:'skp-hero-computer',label:'Твой идеальный компьютер',
 eyebrow:'КОМПЬЮТЕРЫ. КОМПЛЕКТУЮЩИЕ. ПЕРИФЕРИЯ',
 title:'ТВОЙ ИДЕАЛЬНЫЙ\nКОМПЬЮТЕР\nНАЧИНАЕТСЯ ЗДЕСЬ',highlightLine:1,
 description:'Современные комплектующие, готовые решения\nи всё для комфортной игры и работы.',
 primary:'Перейти в каталог',href:'/catalog/all',secondary:'Собрать ПК',secondHref:'/configurator',
 layout:'premium',image:'/images/skp-slide-2.png',image2:'',caption:'',caption2:''},
 {id:'skp-hero-rog',label:'ASUS ROG Azoth Extreme Edition 20 и Harpe II Extreme Edition 20 уже в SKP',
 eyebrow:'ASUS ROG · 20TH ANNIVERSARY',title:'ASUS ROG\nEDITION 20\nУЖЕ В SKP',highlightLine:1,
 description:'ASUS ROG Azoth Extreme Edition 20 Gaming Keyboard\nи ASUS ROG Harpe II Extreme Edition 20 Gaming Mouse уже в SKP.',
 primary:'Смотреть периферию',href:'/catalog/peripherals',secondary:'Весь каталог',secondHref:'/catalog/all',
 layout:'rog',image:'/images/asus-rog-azoth-extreme-edition-20.png',image2:'/images/asus-rog-harpe-ii-extreme-edition-20.png',
 caption:'AZOTH EXTREME · EDITION 20',caption2:'HARPE II EXTREME · EDITION 20'}
];
const textLimits:Record<string,number>={
 label:120,eyebrow:110,title:150,description:500,primary:45,secondary:45,caption:80,caption2:80
};
const fields=Object.keys(textLimits);
const safeImage=(url:string)=>url===''||
 (url.length<=1600&&(/^https:\/\/[^\s"'<>]+$/i.test(url)||
 /^\/(?:images|products)\/[a-zA-Z0-9_/-]+\.(?:png|jpg|jpeg|webp|svg)$/.test(url)||
 /^\/api\/media\?key=slides\/[a-zA-Z0-9_-]{1,90}\/[0-9a-f-]{36}\.webp$/.test(url)));
export function isHeroImageUrl(url:unknown):url is string{
 return typeof url==='string'&&safeImage(url);
}
export function isHeroLink(url:unknown):url is string{
 // Only relative navigation to an internal SKP page; no external or script URLs.
 return typeof url==='string'&&url.length<=300&&/^\/(?!\/)[a-zA-Z0-9_/?#=&%+.-]*$/.test(url)&&!/%(?:2f|5c)/i.test(url);
}
export function validateHeroSlides(value:unknown):value is HeroSlide[]{
 if(!Array.isArray(value)||value.length>MAX_HERO_SLIDES)return false;
 const ids=new Set<string>();
 for(const slide of value){
  if(!slide||typeof slide!=='object'||Array.isArray(slide))return false;
  const s=slide as Record<string,unknown>;
  if(typeof s.id!=='string'||!/^[a-zA-Z0-9_-]{1,90}$/.test(s.id)||ids.has(s.id))return false;
  ids.add(s.id);
  if(!HERO_LAYOUTS.includes(s.layout as HeroLayout))return false;
  for(const key of fields)if(typeof s[key]!=='string'||(s[key] as string).length>textLimits[key])return false;
  if(!(s.label as string).trim()||!(s.title as string).trim()||!(s.primary as string).trim())return false;
  if(typeof s.highlightLine!=='number'||!Number.isInteger(s.highlightLine)||s.highlightLine<0||s.highlightLine>=Math.max(1,(s.title as string).split('\n').length))return false;
  if(!isHeroLink(s.href)||!isHeroLink(s.secondHref)||!isHeroImageUrl(s.image)||!isHeroImageUrl(s.image2))return false;
  if(!s.image)return false;
  if(['logitech','rog','duo'].includes(s.layout as string)&&!s.image2)return false;
 }
 return true;
}
export function moveHeroSlide<T>(slides:readonly T[],index:number,direction:-1|1):T[]{
 const output=[...slides],target=index+direction;
 if(index<0||index>=output.length||target<0||target>=output.length)return output;
 [output[index],output[target]]=[output[target],output[index]];
 return output;
}
export function createHeroSlide():HeroSlide{
 return {id:'hero-'+crypto.randomUUID(),label:'Новый слайд',eyebrow:'НОВИНКА В SKP',
  title:'НОВЫЙ\nСЛАЙД',highlightLine:1,description:'Расскажите о вашем предложении.',
  primary:'Перейти',href:'/catalog/all',secondary:'Весь каталог',secondHref:'/catalog/all',
  layout:'single',image:'/images/skp-slide-2.png',image2:'',caption:'',caption2:''};
}
