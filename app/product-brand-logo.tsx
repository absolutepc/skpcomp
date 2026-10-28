'use client';
import {useState} from 'react';
import type {Product,BrandDefinition} from '../lib/seed';
import {productBrandLogo} from '../lib/brand-logos';
export default function ProductBrandLogo({product,brands}:{product:Product;brands?:readonly BrandDefinition[]}){
 const logo=productBrandLogo(product,brands);
 const [failed,setFailed]=useState('');
 return logo.src&&failed!==logo.src?<img src={logo.src} alt={logo.label} title={logo.label} className={logo.builtin?'skp-builtin-brand-logo':undefined} onError={()=>setFailed(logo.src)}/>:<span title={logo.label}>{logo.label}</span>;
}
