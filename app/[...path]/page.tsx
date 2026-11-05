import Shop from '../shop';
import {readCatalog} from '../../lib/read-catalog';
import {pageMetadata} from '../../lib/page-metadata';
export async function generateMetadata({params}:{params:Promise<{path:string[]}>}){
 const {path}=await params;
 return pageMetadata('/'+path.join('/'),path[0]==='product'?(await readCatalog()).products:[]);
}
export default function Page(){return <Shop/>}
