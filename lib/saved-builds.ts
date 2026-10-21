import type {Product} from './seed';
import {sanitizeBuildSelection,type BuildSelection} from './pc-builder';

export const SAVED_BUILDS_KEY='skp-configurator-builds-v1';
export const MAX_SAVED_BUILDS=12;
export type SavedBuild={id:string;name:string;selected:BuildSelection;updatedAt:number};
type StorageLike={getItem:(key:string)=>string|null;setItem:(key:string,value:string)=>void};

export function readSavedBuilds(storage:Pick<StorageLike,'getItem'>,products:Product[]):SavedBuild[]{
 try{
  const raw=storage.getItem(SAVED_BUILDS_KEY);
  if(!raw){
   const legacy=storage.getItem('skp-saved-build');
   if(!legacy)return [];
   const selected=sanitizeBuildSelection(JSON.parse(legacy),products);
   return Object.keys(selected).length?[{id:'legacy',name:'Ранее сохранённая сборка',selected,updatedAt:Date.now()}]:[];
  }
  const parsed=JSON.parse(raw);
  if(!Array.isArray(parsed))return [];
  const ids=new Set<string>();
  const builds:SavedBuild[]=[];
  for(const entry of parsed){
   if(!entry||typeof entry!=='object'||typeof entry.id!=='string'||!entry.id||
      ids.has(entry.id)||typeof entry.name!=='string')continue;
   const selected=sanitizeBuildSelection(entry.selected,products);
   if(!Object.keys(selected).length)continue;
   ids.add(entry.id);
   builds.push({id:entry.id.slice(0,90),name:entry.name.trim().slice(0,60)||'Моя сборка',
    selected,updatedAt:Number.isFinite(entry.updatedAt)?entry.updatedAt:Date.now()});
   if(builds.length===MAX_SAVED_BUILDS)break;
  }
  return builds;
 }catch{return []}
}
export function writeSavedBuilds(storage:Pick<StorageLike,'setItem'>,builds:SavedBuild[]):void{
 storage.setItem(SAVED_BUILDS_KEY,JSON.stringify(builds.slice(0,MAX_SAVED_BUILDS)));
}
export function saveNamedBuild(storage:StorageLike,products:Product[],selected:BuildSelection,name:string):SavedBuild[]{
 const cleaned=sanitizeBuildSelection(selected,products);
 if(!Object.keys(cleaned).length)throw Error('Выберите хотя бы один компонент.');
 const title=name.trim().slice(0,60)||'Моя сборка';
 const existing=readSavedBuilds(storage,products);
 // Names are unique in the library: saving the same name updates it.
 const previous=existing.find(item=>item.name.toLowerCase()===title.toLowerCase());
 const record:SavedBuild={id:previous?.id||'build-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),name:title,selected:cleaned,updatedAt:Date.now()};
 const next=[record,...existing.filter(item=>item.id!==previous?.id)].slice(0,MAX_SAVED_BUILDS);
 writeSavedBuilds(storage,next);
 return next;
}
export function getShareUrl(selected:BuildSelection,products:Product[],origin:string):string{
 const valid=sanitizeBuildSelection(selected,products);
 if(!Object.keys(valid).length)throw Error('Сначала выберите компоненты.');
 const url=new URL('/configurator',origin);
 url.searchParams.set('build',JSON.stringify({v:1,parts:valid}));
 return url.toString();
}
export function readSharedBuild(search:string,products:Product[]):BuildSelection|null{
 try{
  const encoded=new URLSearchParams(search).get('build');
  if(!encoded||encoded.length>3500)return null;
  const payload=JSON.parse(encoded);
  if(!payload||payload.v!==1)return null;
  const selected=sanitizeBuildSelection(payload.parts,products);
  return Object.keys(selected).length?selected:null;
 }catch{return null}
}
