'use client';
import {useEffect,useState} from 'react';
import {ShoppingCart,Package,PackageCheck,Wallet,Plus,RefreshCw} from 'lucide-react';
import type {Product} from '../lib/seed';
import type {AdminOrder} from '../lib/orders';
import {ORDER_LABELS} from '../lib/orders';
import {getProductImages} from '../lib/product-gallery';
import {AdminProductTable} from './admin-products';
type Summary={orders:number;completedAmount:number};
export default function AdminDashboard({products,search,onAdd,onEdit,onDelete,onOrders}:{products:Product[];search:string;onAdd:()=>void;onEdit:(p:Product)=>void;onDelete:(p:Product)=>void;onOrders:()=>void}){
 const [summary,setSummary]=useState<Summary|null>(null),[error,setError]=useState(''),[revision,setRevision]=useState(0);
 const [latestOrders,setLatestOrders]=useState<AdminOrder[]>([]);
 useEffect(()=>{
  const controller=new AbortController();setSummary(null);setError('');
  fetch('/api/orders?summary=1',{credentials:'same-origin',cache:'no-store',signal:controller.signal})
   .then(async response=>{const result=await response.json() as Summary & {error?:string};if(!response.ok)throw Error(result.error||'Не удалось загрузить показатели заказов');return result as Summary})
   .then(setSummary).catch(e=>{if(e.name!=='AbortError')setError(e.message)});
  fetch('/api/orders?admin=1',{credentials:'same-origin',cache:'no-store',signal:controller.signal})
   .then(async response=>{const result=await response.json() as {orders?:AdminOrder[]};if(!response.ok)throw Error();return result.orders||[]})
   .then(orders=>setLatestOrders(orders.slice(0,5)))
   .catch(()=>setLatestOrders([]));
  return()=>controller.abort();
 },[revision]);
 const cards=[
  {title:'Заказы',value:summary?.orders,Icon:ShoppingCart,tone:'yellow',note:'За всё время'},
  {title:'Товары',value:products.length,Icon:Package,tone:'blue',note:'В каталоге'},
  {title:'В наличии',value:products.filter(p=>p.stock).length,Icon:PackageCheck,tone:'violet',note:'Товарных позиций'},
  {title:'Выполненные заказы',value:summary?new Intl.NumberFormat('ru-RU').format(summary.completedAmount)+' ₽':undefined,Icon:Wallet,tone:'green',note:'Сумма за всё время'}
 ];
 const items=search?products.filter(p=>(p.name+' '+p.brand+' '+p.category).toLowerCase().includes(search.toLowerCase())):[...products].reverse();
 return <div className="skp-admin-dashboard">
  <div className="skp-admin-panel-header"><div><h1>Панель управления</h1><p>Добро пожаловать в админ-панель SKP</p></div><button className="skp-admin-refresh" type="button" onClick={()=>setRevision(x=>x+1)}><RefreshCw size={16}/>Обновить показатели</button></div>
  <div className="skp-admin-stats">{cards.map(({title,value,Icon,tone,note})=><div className="skp-admin-stat" key={title}><span className={'skp-admin-stat-icon '+tone}><Icon size={27}/></span><div><span>{title}</span><strong>{value??(error?'—':'…')}</strong><small>{note}</small></div></div>)}</div>
  {error&&<p role="alert" className="skp-admin-error">{error}. Нажмите «Обновить показатели», чтобы повторить.</p>}
  <section className="skp-admin-mobile-recent-orders">
   <div className="skp-admin-mobile-recent-heading"><h2>Последние заказы</h2><button type="button" onClick={onOrders}>Все <span aria-hidden="true">→</span></button></div>
   {latestOrders.length?latestOrders.map(order=><button key={order.id} type="button" className="skp-admin-mobile-recent-order" onClick={onOrders}>
    <span className="skp-admin-mobile-recent-photo">{(()=>{
     const item=order.items[0],product=products.find(p=>p.id===item?.productId);
     const image=product?getProductImages(product)[0]:undefined;
     return image?<img src={image} alt="" loading="lazy"/>:<span>SKP</span>;
    })()}</span>
    <span className="skp-admin-mobile-recent-main"><strong>{order.number}</strong><small>{new Date(order.createdAt).toLocaleString('ru-RU')}</small></span>
    <span className="skp-admin-mobile-recent-end"><strong>{new Intl.NumberFormat('ru-RU').format(order.total)} ₽</strong><small className={'status-'+order.status}>{ORDER_LABELS[order.status]}</small></span>
   </button>):<p className="skp-admin-mobile-no-orders">Заказы пока не поступали.</p>}
  </section>
  <div className="skp-admin-card"><div className="skp-admin-card-heading"><h2>{search?'Результаты поиска':'Последние добавленные товары'}</h2><button type="button" className="button light" onClick={onAdd}><Plus size={18}/>Добавить товар</button></div><AdminProductTable key={search} items={items} onEdit={onEdit} onDelete={onDelete}/></div>
 </div>;
}
