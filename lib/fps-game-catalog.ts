import {gameProfiles} from './fps-estimate';

/**
 * Configurable FPS game presentation. An ID corresponds to a modeled game in
 * fps-estimate.ts; artwork/name/visibility/order may be edited independently.
 * Existing games use publisher art or store-owner local images, configurable
 * in the admin panel. Unchanged remote artwork must be reviewed for rights.
 */
export type FpsGameAppearance={id:string;name:string;image:string;enabled:boolean};
const steam=(app:number)=>'https://cdn.cloudflare.steamstatic.com/steam/apps/'+app+'/header.jpg';
export const defaultFpsGames:FpsGameAppearance[]=[
 {id:'cs2',name:'Counter-Strike 2',image:steam(730),enabled:true},
 {id:'valorant',name:'Valorant',image:'/images/fps-games/valorant.png',enabled:true},
 {id:'pubg',name:'PUBG: Battlegrounds',image:steam(578080),enabled:true},
 {id:'rust',name:'Rust',image:steam(252490),enabled:true},
 {id:'cyberpunk',name:'Cyberpunk 2077',image:steam(1091500),enabled:true},
 {id:'bf6',name:'Battlefield 6',image:'/images/fps-games/battlefield6.png',enabled:true},
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
 // Upgrade only URLs shipped as former defaults. Custom artwork entered
 // through the admin panel must never be overwritten.
 const oldValorantImage='https://commons.wikimedia.org/wiki/Special:FilePath/Valorant_logo.svg';
 return saved.map(game=>{
  if(game.id==='valorant'&&game.image===oldValorantImage)
   return {...game,image:'/images/fps-games/valorant.png'};
  if(game.id==='bf6'&&game.image===steam(2807960))
   return {...game,image:'/images/fps-games/battlefield6.png'};
  if(game.id==='warface'&&game.image===steam(291480))
   return {...game,image:steam(3889960)};
  return {...game};
 }).filter(x=>knownIds.has(x.id));
}
