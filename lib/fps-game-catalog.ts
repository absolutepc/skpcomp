import {gameProfiles} from './fps-estimate';

/**
 * Configurable FPS game presentation. An ID corresponds to a modeled game in
 * fps-estimate.ts; artwork/name/visibility/order may be edited independently.
 * Steam header capsules are real publisher artwork including game branding.
 * These URLs are external: replace with rights-cleared local assets for release.
 */
export type FpsGameAppearance={id:string;name:string;image:string;enabled:boolean};
const steam=(app:number)=>'https://cdn.cloudflare.steamstatic.com/steam/apps/'+app+'/header.jpg';
export const defaultFpsGames:FpsGameAppearance[]=[
 {id:'cs2',name:'Counter-Strike 2',image:steam(730),enabled:true},
 {id:'valorant',name:'Valorant',image:'https://commons.wikimedia.org/wiki/Special:FilePath/Valorant_logo.svg',enabled:true},
 {id:'pubg',name:'PUBG: Battlegrounds',image:steam(578080),enabled:true},
 {id:'rust',name:'Rust',image:steam(252490),enabled:true},
 {id:'cyberpunk',name:'Cyberpunk 2077',image:steam(1091500),enabled:true},
 {id:'bf6',name:'Battlefield 6',image:steam(2807960),enabled:true},
 {id:'warthunder',name:'War Thunder',image:steam(236390),enabled:true},
 {id:'squad',name:'Squad',image:steam(393380),enabled:true},
 {id:'dota2',name:'Dota 2',image:steam(570),enabled:true},
 {id:'warface',name:'Warface',image:steam(3889960),enabled:true}
];
const knownIds=new Set<string>(gameProfiles.map(x=>x.id));
export function validFpsGameImage(value:string):boolean{
 if(value===''||value.startsWith('/images/'))return value.length<=500;
 try{const u=new URL(value);return u.protocol==='https:'&&u.username===''&&u.password===''&&value.length<=1000}catch{return false}
}
export function validateFpsGames(value:unknown):value is FpsGameAppearance[]{
 if(value===undefined)return true;
 if(!Array.isArray(value)||value.length!==gameProfiles.length)return false;
 const ids=new Set<string>();
 for(const item of value){
  if(!item||typeof item!=='object'||typeof item.id!=='string'||!knownIds.has(item.id)||ids.has(item.id))return false;
  ids.add(item.id);
  if(typeof item.name!=='string'||!item.name.trim()||item.name.length>80)return false;
  if(typeof item.enabled!=='boolean'||typeof item.image!=='string'||!validFpsGameImage(item.image))return false;
 }
 return ids.size===gameProfiles.length;
}
export function getConfiguredFpsGames(value:unknown):FpsGameAppearance[]{
 if(!validateFpsGames(value)||value===undefined)return defaultFpsGames.map(x=>({...x}));
 const saved=value as FpsGameAppearance[];
 // Older configurations used Steam app 291480 (Warface: Clutch).
 // The active Warface published by Astrum Play uses app 3889960.
 // Preserve custom admin images and replace only this exact legacy default.
 return saved.map(x=>x.id==='warface'&&x.image===steam(291480)?
  {...x,image:steam(3889960)}:{...x}).filter(x=>knownIds.has(x.id));
}
