import type {Product} from './seed';
import {matchesFilters,type Facets,type Ranges} from './catalog';

export type CatalogSelection={facets:Facets;ranges:Ranges;min:string;max:string;stock:boolean;query:string};
// Ignore only the current field, so choosing one option does not lock its siblings.
export function filterCandidates(products:Product[],selection:CatalogSelection,except?:string){
 const {facets,ranges,min,max,stock,query}=selection;
 const otherFacets=Object.fromEntries(Object.entries(facets).filter(([key])=>key!==except));
 const otherRanges=Object.fromEntries(Object.entries(ranges).filter(([key])=>key!==except));
 const search=query.trim().toLocaleLowerCase('ru');
 return products.filter(p=>(p.name+' '+p.description+' '+p.brand).toLocaleLowerCase('ru').includes(search)&&
  (!stock||p.stock)&&(except==='price'||((!min||p.price>=Number(min))&&(!max||p.price<=Number(max))))&&
  matchesFilters(p,otherFacets,otherRanges));
}
