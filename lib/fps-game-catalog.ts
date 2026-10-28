import {gameProfiles} from './fps-estimate';

/**
 * Configurable FPS game presentation. An ID corresponds to a modeled game in
 * fps-estimate.ts; artwork/name/visibility/order may be edited independently.
 * Existing games use publisher art or store-owner local images, configurable
 * in the admin panel. Unchanged remote artwork must be reviewed for rights.
 */
export type FpsGameAppearance={id:string;name:string;image:string;enabled:boolean};
const steam=(app:number)=>'https://cdn.cloudflare.steamstatic.com/steam/apps/'+app+'/header.jpg';
// Battlefield 6 soldier artwork matching the selected reference (light sky,
// dark armoured soldier and orange muzzle flash).
const battlefield6Artwork='https://cdn2.steamgriddb.com/grid/c94503a10d4f25207214caeada1d1ae2.png';
const valorantArtwork='/images/fps-games/valorant-mark.svg';
const warfaceArtwork='/images/fps-games/warface-mark.svg';
export const defaultFpsGames:FpsGameAppearance[]=[
 {id:'cs2',name:'Counter-Strike 2',image:steam(730),enabled:true},
 {id:'valorant',name:'Valorant',image:valorantArtwork,enabled:true},
 {id:'pubg',name:'PUBG: Battlegrounds',image:steam(578080),enabled:true},
 {id:'rust',name:'Rust',image:steam(252490),enabled:true},
 {id:'cyberpunk',name:'Cyberpunk 2077',image:steam(1091500),enabled:true},
 {id:'bf6',name:'Battlefield 6',image:battlefield6Artwork,enabled:true},
 {id:'warthunder',name:'War Thunder',image:steam(236390),enabled:true},
 {id:'squad',name:'Squad',image:steam(393380),enabled:true},
 {id:'dota2',name:'Dota 2',image:steam(570),enabled:true},
 {id:'warface',name:'Warface',image:warfaceArtwork,enabled:true}
];
const knownIds=new Set<string>(gameProfiles.map(x=>x.id));
export function validFpsGameImage(value:string):boolean{
 if(value==='')return true;
 if(value.startsWith('/images/'))return value.length<=500;
 // Uploaded artwork is served from the authenticated media store as a
 // same-origin URL. Accept only the FPS games namespace and UUID image keys.
 if(/^\/api\/media\?key=fps-games\/[a-zA-Z0-9_-]{1,90}\/[0-9a-f-]{36}\.(?:png|webp|jpg)$/.test(value))return true;
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
 // Upgrade only artwork matching an old shipped default, including versions
 // persisted before these local vector covers were available. User-chosen
 // artwork from the admin panel is kept unchanged.
 const oldValorantImage='https://commons.wikimedia.org/wiki/Special:FilePath/Valorant_logo.svg';
 return saved.map(game=>{
  if(game.id==='valorant'&&[oldValorantImage,'/images/fps-games/valorant.png'].includes(game.image))
   return {...game,image:valorantArtwork};
  if(game.id==='bf6'&&[steam(2807960),'/images/fps-games/battlefield6.png'].includes(game.image))
   return {...game,image:battlefield6Artwork};
  if(game.id==='warface'&&[steam(291480),steam(3889960)].includes(game.image))
   return {...game,image:warfaceArtwork};
  return game;
 }).filter(x=>knownIds.has(x.id));
}
