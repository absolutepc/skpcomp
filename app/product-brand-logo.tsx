'use client';
import {useState} from 'react';
import type {Product,BrandDefinition} from '../lib/seed';
import {productBrandLogo} from '../lib/brand-logos';
export default function ProductBrandLogo({product,brands}:{product:Product;brands?:readonly BrandDefinition[]}){
 const logo=productBrandLogo(product,brands);
 const [failed,setFailed]=useState('');
 const isMSIWordmark=logo.src==='/images/brands/msi.svg';
 const className=[logo.builtin&&'skp-builtin-brand-logo',isMSIWordmark&&'skp-msi-brand-logo'].filter(Boolean).join(' ');
 return logo.src&&failed!==logo.src?<img src={logo.src} alt={logo.label} title={logo.label} className={className||undefined} onError={()=>setFailed(logo.src)}/>:<span title={logo.label}>{logo.label}</span>;
}
