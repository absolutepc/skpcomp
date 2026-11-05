import {localAdminAccess} from '../../../lib/local-admin-access';
import {storeEnv,isPostgres} from '../../../db/platform-store';
import {seed,type Store} from '../../../lib/seed';
import {normalizeOrderItems,validateContact,orderTotal,isOrderStatus,canTransition,OrderValidationError,type OrderItem,type OrderStatus,type PublicOrder,type AdminOrder,type OrderEvent} from '../../../lib/orders';

const E=await storeEnv();
type OrderRow={id:string;number:string;access_hash:string;customer_name:string;phone:string;comment:string;
 items:string;total:number;status:string;created_at:string;updated_at:string};
type EventRow={status:string;created_at:string};
const json=(value:object,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
const digest=async(value:string)=>{
 const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
 return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
};
const adminAuth=async(request:Request)=>{
 if(localAdminAccess(request))return true;
 if(!E.ADMIN_PASSWORD)return false;
 const token=await digest('skp-session:'+E.ADMIN_PASSWORD);
 return (request.headers.get('cookie')||'').split(';').some(part=>part.trim()==='skp_admin='+token);
};
const originMatches=(request:Request)=>request.headers.get('origin')===new URL(request.url).origin;
async function ensureOrders(){
 if(isPostgres())return; // PostgreSQL tables are provisioned by db/postgres-schema.sql
 await E.DB.prepare("CREATE TABLE IF NOT EXISTS skp_orders (id TEXT PRIMARY KEY NOT NULL, number TEXT NOT NULL UNIQUE, access_hash TEXT NOT NULL, customer_name TEXT NOT NULL, phone TEXT NOT NULL, comment TEXT NOT NULL DEFAULT '', items TEXT NOT NULL, total INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'processing', ip_hash TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))").run();
 await E.DB.prepare("CREATE TABLE IF NOT EXISTS skp_order_events (id TEXT PRIMARY KEY NOT NULL, order_id TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))").run();
 await E.DB.prepare('CREATE INDEX IF NOT EXISTS idx_skp_order_events_order ON skp_order_events(order_id,created_at)').run();
 await E.DB.prepare('CREATE INDEX IF NOT EXISTS idx_skp_orders_created ON skp_orders(created_at)').run();
}
const asStatus=(value:string):OrderStatus=>isOrderStatus(value)?value:'processing';
function toOrder(row:OrderRow,events:OrderEvent[]=[]):AdminOrder{
 let items:OrderItem[]=[];
 try{const raw=JSON.parse(row.items);if(Array.isArray(raw))items=raw as OrderItem[]}catch{}
 return {id:row.id,number:row.number,createdAt:row.created_at,updatedAt:row.updated_at,
  status:asStatus(row.status),items,total:row.total,events,
  customerName:row.customer_name,phone:row.phone,comment:row.comment};
}
const publicOrder=(order:AdminOrder):PublicOrder=>({
 id:order.id,number:order.number,status:order.status,items:order.items,
 total:order.total,createdAt:order.createdAt,updatedAt:order.updatedAt,events:order.events
});
async function eventsFor(id:string):Promise<OrderEvent[]>{
 const result=await E.DB.prepare('SELECT status,created_at FROM skp_order_events WHERE order_id=? ORDER BY created_at ASC,id ASC').bind(id).all<EventRow>();
 return (result.results||[]).filter(row=>isOrderStatus(row.status))
  .map(row=>({status:row.status as OrderStatus,createdAt:row.created_at}));
}
async function getCatalog():Promise<Store>{
 await E.DB.prepare('CREATE TABLE IF NOT EXISTS shop (id TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)').run();
 const record=await E.DB.prepare("SELECT value FROM shop WHERE id='catalog'").first<{value:string}>();
 // Prices are always resolved on the server; client-supplied prices are ignored.
 return record?JSON.parse(record.value) as Store:seed;
}
async function fromRequest(request:Request):Promise<Record<string,unknown>>{
 if(Number(request.headers.get('content-length'))>12000)throw new OrderValidationError('Слишком большой запрос.');
 const text=await request.text();
 if(text.length>12000)throw new OrderValidationError('Слишком большой запрос.');
 let input:unknown;
 try{input=JSON.parse(text)}catch{throw new OrderValidationError('Некорректные данные заявки.')}
 if(!input||typeof input!=='object'||Array.isArray(input))throw new OrderValidationError('Некорректные данные заявки.');
 return input as Record<string,unknown>;
}
export async function GET(request:Request){
 if(!await adminAuth(request))return json({error:'Требуется авторизация администратора.'},401);
 try{
  await ensureOrders();
  if(new URL(request.url).searchParams.get('summary')==='1'){
   const summary=await E.DB.prepare("SELECT COUNT(*) AS orders, COALESCE(SUM(CASE WHEN status='completed' THEN total ELSE 0 END),0) AS completedAmount FROM skp_orders").first<{orders:number;completedAmount:number}>();
   return json(summary||{orders:0,completedAmount:0});
  }
  const rows=await E.DB.prepare('SELECT * FROM skp_orders ORDER BY created_at DESC,id DESC LIMIT 250').all<OrderRow>();
  return json({orders:(rows.results||[]).map(row=>toOrder(row))});
 }catch{return json({error:'Не удалось загрузить заказы.'},503)}
}
export async function POST(request:Request){
 if(!originMatches(request))return json({error:'Запрос с другого сайта запрещён.'},403);
 let input:Record<string,unknown>;
 try{input=await fromRequest(request)}
 catch(e){return json({error:e instanceof Error?e.message:'Неверный запрос.'},400)}
 try{
  await ensureOrders();
  if(input.action==='create'){
   if(typeof input.website==='string'&&input.website.trim())return json({error:'Не удалось отправить заявку.'},400);
   const {customerName,phone,comment}=validateContact(input.name,input.phone,input.comment??'');
   const catalog=await getCatalog();
   const items=normalizeOrderItems(input.items,catalog.products);
   const total=orderTotal(items);
   const ip=request.headers.get('cf-connecting-ip')||'';
   // Limits automated spam without retaining raw IP. Uses the admin secret as salt.
   const ipHash=ip&&E.ADMIN_PASSWORD?await digest('skp-orders:'+E.ADMIN_PASSWORD+':'+ip):'';
   if(ipHash){
    const recent=await E.DB.prepare("SELECT count(*) AS total FROM skp_orders WHERE ip_hash=? AND created_at>=datetime('now','-1 hour')")
     .bind(ipHash).first<{total:number}>();
    if((recent?.total||0)>=8)return json({error:'Слишком много заявок. Попробуйте позже.'},429);
   }
   const id=crypto.randomUUID();
   const number='SKP-'+new Date().toISOString().slice(2,10).replace(/-/g,'')+'-'+id.slice(0,8).toUpperCase();
   const key=Array.from(crypto.getRandomValues(new Uint8Array(32)),byte=>byte.toString(16).padStart(2,'0')).join('');
   const hash=await digest(key);
   await E.DB.batch([
    E.DB.prepare("INSERT INTO skp_orders(id,number,access_hash,customer_name,phone,comment,items,total,status,ip_hash) VALUES(?,?,?,?,?,?,?,?,'processing',?)")
     .bind(id,number,hash,customerName,phone,comment,JSON.stringify(items),total,ipHash),
    E.DB.prepare("INSERT INTO skp_order_events(id,order_id,status) VALUES(?,?,'processing')")
     .bind(crypto.randomUUID(),id)
   ]);
   const row=await E.DB.prepare('SELECT * FROM skp_orders WHERE id=?').bind(id).first<OrderRow>();
   if(!row)return json({error:'Не удалось найти созданную заявку.'},503);
   return json({order:publicOrder(toOrder(row,await eventsFor(id))),accessKey:key},201);
  }
  if(input.action==='view'){
   if(typeof input.id!=='string'||!/^[a-f0-9-]{36}$/i.test(input.id)||
      typeof input.accessKey!=='string'||!/^[a-f0-9]{64}$/i.test(input.accessKey))
    return json({error:'Номер заказа или код доступа некорректен.'},400);
   const hash=await digest(input.accessKey);
   const row=await E.DB.prepare('SELECT * FROM skp_orders WHERE id=? AND access_hash=?')
    .bind(input.id,hash).first<OrderRow>();
   if(!row)return json({error:'Заказ не найден или код доступа неверный.'},404);
   return json({order:publicOrder(toOrder(row,await eventsFor(row.id)))});
  }
  if(input.action==='status'){
   if(!await adminAuth(request))return json({error:'Доступ только для администратора.'},401);
   if(typeof input.id!=='string'||!/^[a-f0-9-]{36}$/i.test(input.id)||!isOrderStatus(input.status))
    return json({error:'Некорректный заказ или статус.'},400);
   const current=await E.DB.prepare('SELECT status FROM skp_orders WHERE id=?').bind(input.id).first<{status:string}>();
   if(!current)return json({error:'Заказ не найден.'},404);
   if(!isOrderStatus(current.status)||!canTransition(current.status,input.status))
    return json({error:'Этот переход между статусами недоступен.'},409);
   // Compare-and-set prevents duplicate/out-of-order updates.
   const changed=await E.DB.prepare("UPDATE skp_orders SET status=?,updated_at=datetime('now') WHERE id=? AND status=?")
    .bind(input.status,input.id,current.status).run();
   if(changed.meta.changes!==1)return json({error:'Статус уже изменён другим сотрудником. Обновите список.'},409);
   await E.DB.prepare('INSERT INTO skp_order_events(id,order_id,status) VALUES(?,?,?)')
    .bind(crypto.randomUUID(),input.id,input.status).run();
   return json({ok:true,status:input.status});
  }
  return json({error:'Неизвестное действие.'},400);
 }catch(error){
  if(error instanceof OrderValidationError)return json({error:error.message},400);
  return json({error:'Сервис заказов временно недоступен. Попробуйте позже.'},503);
 }
}
