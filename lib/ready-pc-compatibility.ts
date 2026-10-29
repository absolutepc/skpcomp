import type {Product} from './seed';
import {analyzeBuild,candidateErrors,type BuildIssue,type BuildSelection} from './pc-builder';

/**
 * Ready-PC editor stores readable part names for legacy compatibility.
 * Resolve names to current catalog IDs only while validating, without
 * changing the persisted product structure or discarding old descriptions.
 */
const slotCategories:Record<string,string>={
 cpu:'cpu',motherboard:'motherboard',ram:'ram',gpu:'gpu',ssd:'ssd',
 storage:'ssd',psu:'psu',case:'case',cooler:'cooler'
};
const normalize=(name:string)=>name.trim().toLocaleLowerCase('ru').replace(/\s+/g,' ');
export function resolveReadyPart(field:string,name:string,products:Product[]):Product|undefined{
 const category=slotCategories[field];
 if(!category||!name.trim())return undefined;
 return products.find(part=>part.category===category&&normalize(part.name)===normalize(name));
}
export function readyBuildSelection(components:Record<string,string>|undefined,products:Product[]):BuildSelection{
 const selected:BuildSelection={};
 for(const field of ['cpu','motherboard','ram','gpu','ssd','psu','case','cooler']){
  const part=resolveReadyPart(field,components?.[field]||'',products);
  if(part)selected[field]=part.id;
 }
 // If there is no main SSD, an additional SSD can still be checked for M.2 support.
 if(!selected.ssd){
  const storage=resolveReadyPart('storage',components?.storage||'',products);
  if(storage)selected.ssd=storage.id;
 }
 return selected;
}
export function readyBuildErrors(components:Record<string,string>|undefined,products:Product[]):BuildIssue[]{
 return analyzeBuild(readyBuildSelection(components,products),products).issues.filter(issue=>issue.severity==='error');
}
/**
 * The same candidateErrors() as the configurator works in both directions:
 * CPU -> motherboard as well as motherboard -> CPU, RAM -> board and board -> RAM,
 * case -> GPU and GPU -> case, PSU, cooler and known dimensions.
 * Empty specification fields remain unknown, not falsely incompatible.
 */
export function readyCandidateErrors(
 field:string,candidate:Product,components:Record<string,string>|undefined,products:Product[]
):BuildIssue[]{
 const slot=field==='extra'?candidate.category:field==='storage'?'ssd':field;
 if(!['cpu','motherboard','ram','gpu','ssd','psu','case','cooler'].includes(slot))return [];
 return candidateErrors(slot,candidate,readyBuildSelection(components,products),products);
}
