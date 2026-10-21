export const HERO_LAYOUTS=['logitech','premium','rog','single','duo'] as const;
export type HeroLayout=typeof HERO_LAYOUTS[number];
export const MAX_SLIDE_IMAGES=16;
export type HeroBreakpoint='desktop'|'tablet'|'mobile';
export type HeroPlacement={x:number;y:number;width:number;height:number;captionX:number;captionY:number};
export type HeroLayer=HeroPlacement&{
 id:string;image:string;caption:string;
 tablet?:HeroPlacement;mobile?:HeroPlacement;
};
export type HeroSlide={
 id:string;label:string;eyebrow:string;title:string;highlightLine:number;description:string;
 primary:string;href:string;secondary:string;secondHref:string;
 layout:HeroLayout;image:string;image2:string;caption:string;caption2:string;layers?:HeroLayer[];
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
 caption:'AZOTH EXTREME · EDITION 20',caption2:'HARPE II EXTREME · EDITION 20'},
 {
  id:'skp-hero-rog-swift-oled-edition-20',
  label:'ASUS ROG Swift OLED PG27AQWP-G Edition 20',
  eyebrow:'ASUS ROG · 20TH ANNIVERSARY',
  title:'ROG SWIFT OLED\nPG27AQWP-G\nEDITION 20',highlightLine:2,
  description:'Лимитированная серия к 20-летию ROG.\nTandem OLED · QHD 540 Гц · HD до 720 Гц.',
  primary:'Подробнее о мониторе',href:'/product/asus-rog-swift-oled-pg27aqwp-g-edition-20',
  secondary:'Все мониторы',secondHref:'/catalog/monitor',
  layout:'rog',image:'https://dlcdnwebimgs.asus.com/gain/80E6E940-7255-4E74-AC75-E3A9B2DA0B36/w1000/h732',image2:'',caption:'ROG SWIFT OLED · EDITION 20',caption2:'',
  layers:[{
   id:'rog-swift-oled-monitor',image:'https://dlcdnwebimgs.asus.com/gain/80E6E940-7255-4E74-AC75-E3A9B2DA0B36/w1000/h732',caption:'PG27AQWP-G · EDITION 20',
   x:75,y:44,width:54,height:74,captionX:75,captionY:85,
   tablet:{x:74,y:44,width:54,height:70,captionX:74,captionY:85},
   mobile:{x:50,y:73,width:96,height:36,captionX:50,captionY:92}
  }]
 }
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
  if(s.layers!==undefined){
   if(!Array.isArray(s.layers)||s.layers.length<1||s.layers.length>MAX_SLIDE_IMAGES)return false;
   const imageIds=new Set<string>();
   for(const entry of s.layers){
    if(!entry||typeof entry!=='object'||Array.isArray(entry))return false;
    const layer=entry as Record<string,unknown>;
    if(typeof layer.id!=='string'||!/^[a-zA-Z0-9_-]{1,90}$/.test(layer.id)||imageIds.has(layer.id))return false;
    imageIds.add(layer.id);
    if(typeof layer.image!=='string'||!layer.image||!isHeroImageUrl(layer.image))return false;
    if(typeof layer.caption!=='string'||layer.caption.length>100)return false;
    for(const name of ['x','y','captionX','captionY']){
     if(typeof layer[name]!=='number'||!Number.isFinite(layer[name])||layer[name]<0||layer[name]>100)return false;
    }
    for(const name of ['width','height']){
     if(typeof layer[name]!=='number'||!Number.isFinite(layer[name])||layer[name]<5||layer[name]>100)return false;
    }
    for(const mode of ['tablet','mobile']){
     if(layer[mode]===undefined)continue;
     const alternate=layer[mode];
     if(!alternate||typeof alternate!=='object'||Array.isArray(alternate))return false;
     for(const name of ['x','y','captionX','captionY','width','height']){
      const value=(alternate as Record<string,unknown>)[name];
      if(typeof value!=='number'||!Number.isFinite(value)||
        value<(name==='width'||name==='height'?5:0)||value>100)return false;
     }
    }
   }
  }else{
   if(!s.image)return false;
   if(['logitech','rog','duo'].includes(s.layout as string)&&!s.image2)return false;
  }
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
  layout:'single',image:'/images/config-reference.png',image2:'',caption:'',caption2:''};
}

const clamp=(n:number,min:number,max:number)=>Math.round(Math.min(max,Math.max(min,n))*10)/10;
export function positionHeroLayer(layer:HeroLayer,changes:Partial<Pick<HeroLayer,'x'|'y'|'captionX'|'captionY'|'width'|'height'>>):HeroLayer{
 const next={...layer};
 for(const [field,value] of Object.entries(changes)){
  if(typeof value!=='number'||!Number.isFinite(value))continue;
  if(field==='width'||field==='height')next[field]=clamp(value,5,100);
  else if(field==='x'||field==='y'||field==='captionX'||field==='captionY')next[field]=clamp(value,0,100);
 }
 return next;
}
/** Turn an existing preset into independently positioned assets without deleting its text or links. */
export function enableHeroCanvas(slide:HeroSlide):HeroSlide{
 if(slide.layers?.length)return slide;
 const hasSecond=Boolean(slide.image2);
 const positions=hasSecond?[65,86]:[72];
 const urls=[slide.image,...(hasSecond?[slide.image2]:[])].filter(Boolean);
 return {...slide,layers:urls.map((url,i)=>{
  const x=positions[i]??72;
  return {id:'image-'+i+'-'+slide.id,image:url,caption:i===0?slide.caption:slide.caption2,
   x,y:48,width:hasSecond?22:39,height:hasSecond?58:72,captionX:x,captionY:85};
 })};
}
export function addHeroLayer(slide:HeroSlide):HeroSlide{
 const active=enableHeroCanvas(slide);
 const layers=active.layers||[];
 if(layers.length>=MAX_SLIDE_IMAGES)return active;
 const index=layers.length;
 const x=clamp(58+(index%4)*11,0,100);
 const y=clamp(39+Math.floor(index/4)*10,0,100);
 return {...active,layers:[...layers,{id:'layer-'+crypto.randomUUID(),
  image:slide.image||'/images/skp-slide-2.png',caption:'',
  x,y,width:22,height:48,captionX:x,captionY:clamp(y+34,0,100)}]};
}
export function removeHeroLayer(slide:HeroSlide,id:string):HeroSlide{
 const list=slide.layers;
 if(!list||list.length<=1)return slide;
 return {...slide,layers:list.filter(image=>image.id!==id)};
}

export function resolveHeroPlacement(layer:HeroLayer,mode:HeroBreakpoint,index=0,count=1):HeroPlacement{
 const base:HeroPlacement={x:layer.x,y:layer.y,width:layer.width,height:layer.height,
  captionX:layer.captionX,captionY:layer.captionY};
 if(mode==='desktop')return base;
 if(mode==='tablet')return layer.tablet??base;
 if(layer.mobile)return layer.mobile;
 // Old saved records did not distinguish mobile: turn right-side desktop art into
 // a separate lower-stage composition that avoids the text at the top.
 const x=count===1?50:Math.min(88,Math.max(12,50+(index-(count-1)/2)*Math.min(42,90/count)));
 const mobileY=79;
 return {x,y:mobileY,width:Math.min(85,count===1?72:Math.max(16,90/count)),
  height:count===1?34:29,captionX:x,captionY:95};
}
export function setHeroBreakpointPlacement(
 layer:HeroLayer,mode:HeroBreakpoint,changes:Partial<HeroPlacement>,index=0,count=1
):HeroLayer{
 if(mode==='desktop')return positionHeroLayer(layer,changes);
 const current=resolveHeroPlacement(layer,mode,index,count);
 const updated=positionHeroLayer({...layer,...current},changes);
 const placement:HeroPlacement={x:updated.x,y:updated.y,width:updated.width,height:updated.height,
  captionX:updated.captionX,captionY:updated.captionY};
 return {...layer,[mode]:placement};
}

/**
 * Revision 3 gives the OLED slide an uncropped official ASUS studio photo
 * and safe positions; keep owner-uploaded images and prior slide ordering.
 * Never touch other slides; preserve the uploaded fourth-slide image and ID.
 * A store already upgraded to revision 1 may have intentionally deleted the
 * monitor slide, in which case it must not be resurrected.
 */
export const HERO_SLIDES_VERSION=3;
export function upgradeRogSwiftOledSlide(slides:HeroSlide[]|undefined,version=0):HeroSlide[]{
 const current=slides??defaultHeroSlides;
 if(version>=HERO_SLIDES_VERSION)return current;
 const preset=defaultHeroSlides.find(s=>s.id==='skp-hero-rog-swift-oled-edition-20')!;
 const existing=current.find(s=>s.id===preset.id||/PG27AQWP[\s-]?G/i.test(s.label+' '+s.title));
 if(!existing&&version>=1)return current; // Respect a deliberate deletion after v1.
 if(!existing&&current.length>=MAX_HERO_SLIDES)return current;
 const legacyImage=existing?.layers?.find(layer=>layer.image&&
  layer.image!=='/images/config-reference.png'&&layer.image!=='/images/skp-slide-2.png')?.image
  ||(existing?.image&&existing.image!=='/images/config-reference.png'&&
    existing.image!=='/images/skp-slide-2.png'?existing.image:undefined);
 // When the old default official image was used, switch to the higher
 // resolution source; keep all other image URLs, including user uploads.
 const previousOfficialImages=new Set([
  'https://press.asus.com/assets/w_640%2Ch_640/4332432d-73e9-4785-b9d4-f432996f3af9/ROG%20Swift%20OLED%20PG27AQWP-G%20Edition%2020.png',
  'https://dlcdnwebimgs.asus.com/gain/80E6E940-7255-4E74-AC75-E3A9B2DA0B36/w1000/h732'
 ]);
 const picture=legacyImage&&!previousOfficialImages.has(legacyImage)?legacyImage:preset.image;
 const updated:HeroSlide={...preset,id:existing?.id||preset.id,
  image:picture,layers:preset.layers!.map(layer=>({...layer,id:existing?.layers?.[0]?.id||layer.id,image:picture}))};
 if(existing){
  return current.map(slide=>slide===existing?updated:slide);
 }
 const result=[...current];
 result.splice(Math.min(3,result.length),0,updated);
 return result;
}
