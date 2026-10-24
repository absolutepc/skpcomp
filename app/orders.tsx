'use client';
import {useEffect,useState} from 'react';
import {ArrowRight,CheckCircle2,ClipboardCopy,Clock3,PackageCheck,Phone,RefreshCw,ShoppingBag,XCircle} from 'lucide-react';
import type {Product} from '../lib/seed';
import {getProductImages} from '../lib/product-gallery';
import {ORDER_HISTORY_STORAGE,ORDER_LABELS,ORDER_TRANSITIONS,groupCart,parseOrderKeys,rememberOrder,type OrderKey,type OrderStatus,type PublicOrder,type AdminOrder} from '../lib/orders';
import './orders.css';

const money=(value:number)=>new Intl.NumberFormat('ru-RU').format(value)+' ₽';
const datetime=(value:string)=>{const date=new Date(value.includes('T')?value:value.replace(' ','T')+'Z');return Number.isFinite(date.getTime())?date.toLocaleString('ru-RU'):'—'};
async function orderAPI(payload:object){
 const response=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify(payload)});
 const data=await response.json() as {error?:string;order?:PublicOrder;accessKey?:string};
 if(!response.ok)throw Error(data.error||'Не удалось выполнить запрос.');
 return data;
}
function Status({status}:{status:OrderStatus}){
 return <span className={'skp-order-status status-'+status}>{status==='processing'?<Clock3 size={14}/>:status==='assembled'||status==='completed'?<PackageCheck size={14}/>:<XCircle size={14}/>} {ORDER_LABELS[status]}</span>;
}
function Steps({order}:{order:PublicOrder}){
 const sequence:OrderStatus[]=['processing','assembled','completed'];
 const current=sequence.indexOf(order.status);
 return <div className="skp-order-progress" aria-label="Состояние заказа">
  {sequence.map((status,index)=><div key={status} className={'skp-order-step'+(current>=index?' reached':'')+(current===index?' current':'')}>
   <span>{index+1}</span><small>{ORDER_LABELS[status]}</small>
  </div>)}
  {order.status==='cancelled'&&<p className="skp-order-cancelled"><XCircle size={16}/> Заказ отменён — дальнейшая сборка остановлена.</p>}
 </div>;
}
function Lines({order}:{order:PublicOrder}){
 return <div className="skp-order-lines">{order.items.map(item=>
  <div key={item.productId}><span>{item.name}<small>{item.quantity} шт. × {money(item.unitPrice)}</small></span><strong>{money(item.subtotal)}</strong></div>
 )}<div className="skp-order-sum"><strong>Итого</strong><strong>{money(order.total)}</strong></div></div>;
}
function OrderCard({order,extra}:{order:PublicOrder;extra?:React.ReactNode}){
 return <article className="skp-order-card">
  <div className="skp-order-card-head"><div><strong>{order.number}</strong><small>Создан: {datetime(order.createdAt)}</small></div><Status status={order.status}/></div>
  <Steps order={order}/>
  <details><summary>Состав заказа ({order.items.length} поз.)</summary><Lines order={order}/></details>
  {!!order.events.length&&<details className="skp-order-events"><summary>История изменений</summary><ol>{order.events.map((event,index)=><li key={index}><span>{ORDER_LABELS[event.status]}</span><time>{datetime(event.createdAt)}</time></li>)}</ol></details>}
  {extra}
 </article>;
}
export function Checkout({cart,products,whatsapp,onSuccess,nav}:{cart:string[];products:Product[];whatsapp:string;onSuccess:()=>void;nav:(path:string)=>void}){
 const [name,setName]=useState(''),[phone,setPhone]=useState(''),[comment,setComment]=useState('');
 const [website,setWebsite]=useState('');
 const [submitting,setSubmitting]=useState(false),[error,setError]=useState('');
 const [created,setCreated]=useState<{order:PublicOrder;accessKey:string}|null>(null);
 const summary=groupCart(cart).map(item=>({...item,product:products.find(p=>p.id===item.id)})).filter((item):item is typeof item & {product:Product}=>!!item.product);
 const total=summary.reduce((sum,item)=>sum+item.product.price*item.quantity,0);
 const canSubmit=summary.length>0&&summary.length<=30&&summary.every(item=>item.product.price>0&&item.quantity<=20);
 async function send(event:React.FormEvent){
  event.preventDefault();if(submitting||created)return;
  setSubmitting(true);setError('');
  try{
   const response=await orderAPI({action:'create',name,phone,comment,website,items:summary.map(({id,quantity})=>({id,quantity}))});
   if(!response.order||!response.accessKey)throw Error('Сервер не вернул данные заказа.');
   const order=response.order, accessKey=response.accessKey;
   setCreated({order,accessKey});
   try{
    const saved=rememberOrder(localStorage.getItem(ORDER_HISTORY_STORAGE),{
     id:order.id,accessKey,number:order.number,createdAt:order.createdAt
    });
    localStorage.setItem(ORDER_HISTORY_STORAGE,JSON.stringify(saved));
   }catch{setError('Не удалось сохранить историю в этом браузере. Скопируйте код доступа ниже.')}
   onSuccess();
  }catch(e){setError(e instanceof Error?e.message:'Не удалось оформить заявку.')}finally{setSubmitting(false)}
 }
 const privateCode=created?created.order.id+':'+created.accessKey:'';
 const copy=async()=>{try{await navigator.clipboard.writeText(privateCode)}catch{setError('Не удалось скопировать код. Выделите его вручную.')}};
 if(created)return <section className="skp-orders-page"><div className="skp-order-confirm">
  <CheckCircle2 size={42}/><div className="eyebrow">SKP / ЗАКАЗ ПРИНЯТ</div><h1>Заявка оформлена</h1>
  <p>Заказ <strong>{created.order.number}</strong> сохранён со статусом «В процессе». Менеджер подтвердит наличие, детали заказа и способ оплаты по телефону. Онлайн-оплата не требуется.</p>
  <Status status={created.order.status}/>
  <div className="skp-order-secret"><label htmlFor="order-access-code">Код доступа к заказу (храните приватно)</label>
   <textarea id="order-access-code" readOnly rows={3} value={privateCode} onFocus={event=>event.currentTarget.select()}/>
   <button type="button" className="button outline" onClick={()=>void copy()}><ClipboardCopy size={16}/> Скопировать код</button>
  </div>
  {error&&<p className="skp-order-error" role="alert">{error}</p>}
  <div className="skp-order-buttons"><button className="button light" onClick={()=>nav('/orders')}>Мои заказы <ArrowRight size={16}/></button>
   {whatsapp&&<a className="button outline" rel="noopener noreferrer" target="_blank" href={'https://wa.me/'+whatsapp+'?text='+encodeURIComponent('Здравствуйте! Оформил заявку '+created.order.number+' на сайте SKP. Прошу подтвердить наличие и условия.')}>Написать менеджеру</a>}
  </div>
 </div></section>;
 return <section className="skp-orders-page">
  <div className="eyebrow">SKP / ОФОРМЛЕНИЕ</div><h1>Оформить заказ</h1>
  <p className="skp-orders-lead">Оставьте контакты. Заказ сохранится в истории, а менеджер уточнит наличие и согласует оплату и получение. Оплата на сайте не производится.</p>
  {!summary.length?<div className="skp-orders-empty"><ShoppingBag size={32}/><p>В корзине пока нет товаров.</p><button className="button light" onClick={()=>nav('/catalog/all')}>В каталог</button></div>:
  <div className="skp-checkout-layout">
   <form className="skp-checkout-form" onSubmit={e=>void send(e)}>
    <h2>Контактные данные</h2><label>Ваше имя<input autoComplete="name" required minLength={2} maxLength={80} placeholder="Как к вам обращаться" value={name} onChange={e=>setName(e.target.value)}/></label>
    <label>Номер телефона<input type="tel" autoComplete="tel" required minLength={10} maxLength={25} placeholder="+7 (999) 123-45-67" value={phone} onChange={e=>setPhone(e.target.value)}/></label>
    <label>Комментарий к заказу<textarea maxLength={500} rows={4} placeholder="Вопросы по сборке или получению (необязательно)" value={comment} onChange={e=>setComment(e.target.value)}/></label>
    <label className="skp-orders-honeypot" aria-hidden="true">Ваш сайт<input tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)}/></label>
    <p>Отправляя заявку, вы соглашаетесь на использование контактных данных для обработки этого заказа. Цены и наличие подтверждает менеджер.</p>
    {error&&<p className="skp-order-error" role="alert">{error}</p>}
    <button type="submit" className="button light" disabled={!canSubmit||submitting}>{submitting?'Отправляем…':'Оформить заявку'} <ArrowRight size={16}/></button>
    {!canSubmit&&<p className="skp-order-error">Проверьте состав корзины: у каждого товара должна быть указана цена, не более 20 шт. одной позиции.</p>}
   </form>
   <aside className="skp-checkout-summary"><h2>Ваш заказ</h2>{summary.map(({id,quantity,product})=><div key={id}><span>{product.name}<small>{quantity} шт. × {money(product.price)}</small></span><strong>{money(product.price*quantity)}</strong></div>)}<div className="skp-order-sum"><strong>Итого</strong><strong>{money(total)}</strong></div></aside>
  </div>}
 </section>;
}
export function OrderHistory({nav}:{nav:(p:string)=>void}){
 const [keys,setKeys]=useState<OrderKey[]>([]);
 const [orders,setOrders]=useState<PublicOrder[]>([]);
 const [pending,setPending]=useState(false),[error,setError]=useState(''),[code,setCode]=useState('');
 const load=async(list:OrderKey[])=>{
  setPending(true);setError('');
  try{
   const results=await Promise.allSettled(list.map(async key=>{
    const response=await orderAPI({action:'view',id:key.id,accessKey:key.accessKey});
    if(!response.order)throw Error('Недоступен');return response.order;
   }));
   setOrders(results.flatMap(result=>result.status==='fulfilled'?[result.value]:[]));
   if(results.some(result=>result.status==='rejected'))setError('Некоторые заказы не удалось загрузить. Повторите обновление.');
  }catch{setError('Не удалось загрузить историю.')}finally{setPending(false)}
 };
 useEffect(()=>{let records:OrderKey[]=[];try{records=parseOrderKeys(localStorage.getItem(ORDER_HISTORY_STORAGE))}catch{}setKeys(records);void load(records)},[]);
 async function restore(event:React.FormEvent){
  event.preventDefault();
  const match=code.trim().match(/^([a-f0-9-]{36}):([a-f0-9]{64})$/i);
  if(!match){setError('Вставьте полный код заказа в формате ID:ключ доступа.');return}
  setPending(true);setError('');
  try{
   const response=await orderAPI({action:'view',id:match[1],accessKey:match[2]});
   if(!response.order)throw Error('Заказ не найден.');
   const record:OrderKey={id:response.order.id,accessKey:match[2],number:response.order.number,createdAt:response.order.createdAt};
   const next=rememberOrder(JSON.stringify(keys),record);
   localStorage.setItem(ORDER_HISTORY_STORAGE,JSON.stringify(next));
   setKeys(next);setCode('');await load(next);
  }catch(e){setError(e instanceof Error?e.message:'Не удалось восстановить заказ.');setPending(false)}
 }
 return <section className="skp-orders-page"><div className="eyebrow">SKP / ЗАКАЗЫ</div>
  <div className="skp-order-list-title"><div><h1>История заказов</h1><p>Заказы этого браузера. Статусы обновляются по данным магазина, изменения сохраняются в истории.</p></div>
   <button className="button outline" onClick={()=>void load(keys)} disabled={pending}><RefreshCw size={16}/> Обновить</button>
  </div>
  {error&&<p className="skp-order-error" role="alert">{error}</p>}
  {pending&&<p className="skp-orders-lead">Загружаем заказы…</p>}
  {!pending&&!orders.length&&<div className="skp-orders-empty"><ShoppingBag size={36}/><h2>Заказов пока нет</h2><p>Оформите первый заказ из корзины или восстановите доступ по коду.</p><button className="button light" onClick={()=>nav('/catalog/all')}>В каталог <ArrowRight size={16}/></button></div>}
  <div className="skp-order-list">{orders.map(order=><OrderCard key={order.id} order={order}/>)}</div>
  <form className="skp-restore-order" onSubmit={e=>void restore(e)}><h2>Открыть заказ с другого устройства</h2>
   <p>Вставьте приватный код, полученный при оформлении. Не передавайте его посторонним: он открывает сведения о заказе.</p>
   <textarea rows={2} aria-label="Код доступа к заказу" placeholder="ID заказа:код доступа" value={code} onChange={e=>setCode(e.target.value)}/>
   <button className="button outline" type="submit" disabled={pending}>Восстановить заказ</button>
  </form>
 </section>;
}
export function AdminOrders({products=[]}:{products?:Product[]}){
 const [orders,setOrders]=useState<AdminOrder[]>([]);
 const [filter,setFilter]=useState<'all'|OrderStatus>('all');
 const [search,setSearch]=useState('');
 const [pending,setPending]=useState(false),[busy,setBusy]=useState(''),[error,setError]=useState('');
 async function load(){
  setPending(true);setError('');
  try{
   const response=await fetch('/api/orders?admin=1',{credentials:'same-origin',cache:'no-store'});
   const data=await response.json() as {orders?:AdminOrder[];error?:string};
   if(!response.ok)throw Error(data.error||'Не удалось загрузить заявки.');
   setOrders(data.orders||[]);
  }catch(e){setError(e instanceof Error?e.message:'Ошибка загрузки заказов')}finally{setPending(false)}
 }
 useEffect(()=>{void load()},[]);
 async function change(id:string,status:OrderStatus){
  setBusy(id);setError('');
  try{await orderAPI({action:'status',id,status});await load()}
  catch(e){setError(e instanceof Error?e.message:'Не удалось изменить статус.');await load()}
  finally{setBusy('')}
 }
 const filtered=orders.filter(order=>(filter==='all'||order.status===filter)&&
  (order.number+' '+order.customerName+' '+order.phone).toLowerCase().includes(search.trim().toLowerCase()));
 return <section className="skp-admin-orders" aria-label="Управление заказами">
  <div className="skp-admin-orders-header"><div><h2>Заказы <small>/ {orders.length}</small></h2><p>Меняйте этап выполнения. Отменённые и выполненные заказы закрыты для изменений.</p></div>
   <div><select aria-label="Фильтр заказов" value={filter} onChange={e=>setFilter(e.target.value as typeof filter)}><option value="all">Все статусы</option>{Object.entries(ORDER_LABELS).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><button type="button" className="button outline" onClick={()=>void load()} disabled={pending}><RefreshCw size={15}/> Обновить</button></div>
  </div>
  <div className="skp-admin-mobile-order-controls">
    <div className="skp-admin-mobile-order-tabs" role="group" aria-label="Фильтр заказов">
     {([['all','Все'],['processing','В процессе'],['assembled','Собраны'],['completed','Выполнены'],['cancelled','Отменены']] as const).map(([value,label])=>
      <button type="button" key={value} aria-pressed={filter===value} className={filter===value?'selected':''} onClick={()=>setFilter(value)}>{label}</button>)}
    </div>
    <label className="skp-admin-mobile-order-search"><span>Поиск по заказам</span><input type="search" placeholder="Номер, покупатель или телефон" value={search} onChange={e=>setSearch(e.target.value)}/></label>
   </div>
  {error&&<p className="skp-order-error" role="alert">{error}</p>}
  {!filtered.length?<p className="skp-orders-lead">{pending?'Загрузка…':'Заказов с выбранным статусом нет.'}</p>:<div className="skp-admin-orders-list">
   <div className="skp-admin-mobile-orders-list">
    {filtered.map(order=><article key={order.id} className="skp-admin-mobile-order">
      <div className="skp-admin-mobile-order-top"><div><strong>{order.number}</strong><small>{datetime(order.createdAt)}</small></div><Status status={order.status}/></div>
      <div className="skp-admin-mobile-order-details-head">
       <div className="skp-admin-mobile-order-photos">
        {order.items.slice(0,3).map(item=>{
         const product=products.find(p=>p.id===item.productId);
         const image=product?getProductImages(product)[0]:undefined;
         return <span key={item.productId}>{image?<img src={image} alt="" loading="lazy"/>:<ShoppingBag size={18}/>}</span>;
        })}
       </div>
       <strong>{money(order.total)}</strong>
      </div>
      <details className="skp-admin-mobile-order-expand"><summary>Подробнее о заказе</summary>
       <p><b>Покупатель:</b> {order.customerName}</p><p><b>Телефон:</b> <a href={'tel:'+order.phone.replace(/[^\d+]/g,'')}>{order.phone}</a></p>
       {order.comment&&<p><b>Комментарий:</b> {order.comment}</p>}
       <Lines order={order}/>
       <div className="skp-admin-order-actions">{ORDER_TRANSITIONS[order.status].map(status=>
        <button type="button" key={status} className={'button '+(status==='cancelled'?'outline':'light')} disabled={busy===order.id} onClick={()=>void change(order.id,status)}>
         {status==='cancelled'?'Отменить заказ':'Перевести: '+ORDER_LABELS[status]}</button>
       )}{!ORDER_TRANSITIONS[order.status].length&&<small>Заказ закрыт</small>}</div>
      </details>
    </article>)}
   </div>
   <div className="skp-admin-orders-desktop">{filtered.map(order=>
   <OrderCard key={order.id} order={order} extra={<div className="skp-admin-order-details">
    <p><strong>Покупатель:</strong> {order.customerName} · <a href={'tel:'+order.phone.replace(/[^\d+]/g,'')}><Phone size={13}/> {order.phone}</a></p>
    {order.comment&&<p><strong>Комментарий:</strong> {order.comment}</p>}
    <div className="skp-admin-order-actions">{ORDER_TRANSITIONS[order.status].map(status=>
     <button key={status} className={'button '+(status==='cancelled'?'outline':'light')} disabled={busy===order.id} onClick={()=>void change(order.id,status)}>
      {status==='cancelled'?'Отменить заказ':'Перевести: '+ORDER_LABELS[status]}</button>
    )}{!ORDER_TRANSITIONS[order.status].length&&<small>Заказ закрыт</small>}</div>
   </div>}/>)}</div></div>}
 </section>;
}
