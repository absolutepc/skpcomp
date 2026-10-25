'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {ArrowUpRight,X} from 'lucide-react';
import type {Product} from '../lib/seed';
import {fieldsForProduct,fieldValue} from '../lib/catalog';
import {getBuildRows} from '../lib/build-components';
import './product-specifications.css';

export default function ProductSpecifications({product}:{product:Product}){
 const [open,setOpen]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null);
 const titleId=useId();
 const rows=product.category==='pc'
  ?getBuildRows(product)
  :fieldsForProduct(product).map(field=>({
   key:field.key,label:field.label+(field.unit?', '+field.unit:''),
   value:fieldValue(product,field.key)
  }));
 const filled=rows.filter(row=>String(row.value??'').trim()!=='');
 useEffect(()=>{
  if(!open||!dialog.current)return;
  const element=dialog.current;
  const overflow=document.body.style.overflow;
  element.showModal();
  document.body.style.overflow='hidden';
  return()=>{element.close();document.body.style.overflow=overflow};
 },[open]);
 if(!filled.length)return null;
 const list=(all:boolean)=><dl className="skp-spec-list">{(all?filled:filled.slice(0,7)).map(row=>
  <div className="skp-spec-row" key={row.key}><dt>{row.label}</dt><dd>{row.value}</dd></div>
 )}</dl>;
 return <div className="skp-product-specifications">
  <h3>Характеристики</h3>
  {list(false)}
  <button className="button outline skp-spec-details" onClick={()=>setOpen(true)} aria-haspopup="dialog">Подробные ТТХ <ArrowUpRight size={17}/></button>
  <dialog ref={dialog} className="skp-spec-dialog" aria-labelledby={titleId}
   onClose={()=>setOpen(false)} onClick={event=>{if(event.target===event.currentTarget)setOpen(false)}}>
   <div className="skp-spec-dialog-content">
    <div className="skp-spec-dialog-heading">
     <div><h2 id={titleId}>Подробные характеристики</h2><p>{product.name}</p></div>
     <button type="button" className="skp-spec-close" aria-label="Закрыть характеристики" onClick={()=>setOpen(false)} autoFocus><X size={22}/></button>
    </div>
    <div className="skp-spec-dialog-scroll">{list(true)}</div>
   </div>
  </dialog>
 </div>;
}
