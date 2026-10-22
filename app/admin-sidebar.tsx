'use client';
import {useState,type ReactNode} from 'react';
import {LayoutDashboard,ClipboardList,ContactRound,Images,MessageSquareQuote,Monitor,Package,Laptop,LogOut,ArrowUpRight,Menu,Search,X} from 'lucide-react';
import './admin-sidebar.css';
export const ADMIN_SECTIONS=[
 {id:'dashboard',label:'Главная'},
 {id:'products',label:'Товары'},
 {id:'laptops',label:'Ноутбуки'},
 {id:'pcs',label:'Готовые ПК'},
 {id:'orders',label:'Заказы'},
 {id:'reviews',label:'Отзывы'},
 {id:'slides',label:'Слайды'},
 {id:'contacts',label:'Контакты'}
] as const;
export type AdminSection=typeof ADMIN_SECTIONS[number]['id'];
export function adminSectionFromQuery(value:string|null):AdminSection{
 return ADMIN_SECTIONS.find(item=>item.id===value)?.id??'dashboard';
}
const icons={dashboard:LayoutDashboard,contacts:ContactRound,slides:Images,products:Package,laptops:Laptop,pcs:Monitor,orders:ClipboardList,reviews:MessageSquareQuote};
export default function AdminSidebar({active,onChange,productsCount,laptopsCount,pcsCount,children,search,onSearch,onLogout}:{
 active:AdminSection;onChange:(value:AdminSection)=>void;productsCount:number;laptopsCount:number;pcsCount:number;children:ReactNode;
 search:string;onSearch:(value:string)=>void;onLogout:()=>void;
}){
 const [open,setOpen]=useState(false);
 return <div className={'skp-admin-layout'+(open?' menu-open':'')}>
  {open&&<button className="skp-admin-scrim" type="button" aria-label="Закрыть меню" onClick={()=>setOpen(false)}/>}
  <aside className="skp-admin-sidebar">
   <a href="/" className="skp-admin-brand" aria-label="SKP — на сайт"><svg viewBox="145 430 825 335" role="img" aria-label="SKP"><image href="/images/skp-logo.jpg" width="1080" height="1080"/></svg></a>
   <button className="skp-admin-menu-close" type="button" aria-label="Закрыть меню" onClick={()=>setOpen(false)}><X size={20}/></button>
   <nav aria-label="Разделы админ-панели" className="skp-admin-menu">
    {ADMIN_SECTIONS.map(({id,label})=>{
     const Icon=icons[id],count=id==='products'?productsCount:id==='laptops'?laptopsCount:id==='pcs'?pcsCount:null;
     return <button type="button" key={id} className={'skp-admin-tab'+(active===id?' active':'')}
      onClick={()=>{onChange(id);setOpen(false)}} aria-current={active===id?'page':undefined}>
      <Icon size={20}/><span>{id==='slides'?'Баннеры':label}</span>{count!==null&&<small>{count}</small>}
     </button>;
    })}
   </nav>
   <div className="skp-admin-sidebar-bottom"><a href="/configurator"><Monitor size={18}/>Конфигуратор <ArrowUpRight size={14}/></a><a href="/"><ArrowUpRight size={18}/>Открыть магазин</a><button type="button" onClick={onLogout}><LogOut size={18}/>Выйти</button></div>
  </aside>
  <div className="skp-admin-work">
   <div className="skp-admin-topbar">
    <button type="button" className="skp-admin-menu-toggle" aria-label={open?'Закрыть меню':'Открыть меню'} aria-expanded={open} onClick={()=>setOpen(!open)}><Menu size={21}/></button>
    <label className="skp-admin-global-search"><Search size={20}/><input aria-label="Поиск по всем товарам" placeholder="Поиск по товарам, моделям, брендам…" value={search} onChange={e=>onSearch(e.target.value)}/>{search&&<button type="button" aria-label="Очистить поиск" onClick={()=>onSearch('')}><X size={16}/></button>}</label>
    <div className="skp-admin-account"><span>A</span><div>Администратор<small>Управление SKP</small></div></div>
   </div>
   <div id={'skp-admin-panel-'+active} className="skp-admin-main" role="region" aria-label={ADMIN_SECTIONS.find(item=>item.id===active)?.label}>{children}</div>
  </div>
 </div>;
}
