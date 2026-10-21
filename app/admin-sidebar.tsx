'use client';
import {ChevronRight,ClipboardList,ContactRound,Images,MessageSquareQuote,Monitor,Package} from 'lucide-react';
import type {ReactNode} from 'react';
import './admin-sidebar.css';

export const ADMIN_SECTIONS=[
 {id:'contacts',label:'Контакты и информация'},
 {id:'slides',label:'Слайды'},
 {id:'products',label:'Товары'},
 {id:'pcs',label:'Готовые ПК'},
 {id:'orders',label:'Заказы'},
 {id:'reviews',label:'Отзывы'}
] as const;
export type AdminSection=typeof ADMIN_SECTIONS[number]['id'];

export function adminSectionFromQuery(value:string|null):AdminSection{
 return ADMIN_SECTIONS.find(item=>item.id===value)?.id??'contacts';
}
const icons={
 contacts:ContactRound,
 slides:Images,
 products:Package,
 pcs:Monitor,
 orders:ClipboardList,
 reviews:MessageSquareQuote
} as const;

export default function AdminSidebar({active,onChange,productsCount,pcsCount,children}:{
 active:AdminSection;
 onChange:(value:AdminSection)=>void;
 productsCount:number;
 pcsCount:number;
 children:ReactNode;
}){
 return <div className="skp-admin-layout">
  <aside className="skp-admin-sidebar">
   <div className="skp-admin-sidebar-caption"><span className="skp-admin-sidebar-dot"/> SKP / УПРАВЛЕНИЕ</div>
   <nav aria-label="Разделы админ-панели" className="skp-admin-menu">
    {ADMIN_SECTIONS.map(({id,label})=>{
     const Icon=icons[id];
     const count=id==='products'?productsCount:id==='pcs'?pcsCount:null;
     return <button type="button" key={id}
      className={'skp-admin-tab'+(active===id?' active':'')}
      onClick={()=>onChange(id)} aria-current={active===id?'page':undefined}
      aria-controls={'skp-admin-panel-'+id}>
      <Icon size={19} strokeWidth={1.8} aria-hidden="true"/>
      <span className="skp-admin-tab-label">{label}</span>
      {count!==null&&<span className="skp-admin-tab-count">{count}</span>}
      {active===id&&<ChevronRight className="skp-admin-tab-chevron" size={16} aria-hidden="true"/>}
     </button>;
    })}
   </nav>
   <div className="skp-admin-sidebar-foot">Панель управления магазином</div>
  </aside>
  <div id={'skp-admin-panel-'+active} className="skp-admin-main" role="region"
   aria-label={ADMIN_SECTIONS.find(item=>item.id===active)?.label}>
   {children}
  </div>
 </div>;
}
