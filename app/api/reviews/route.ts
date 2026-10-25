import {localAdminAccess} from '../../../lib/local-admin-access';
import {storeEnv,isPostgres} from '../../../db/platform-store';

const E=await storeEnv();
type ReviewRow={id:string;product_id:string;author:string;rating:number;body:string;status:string;created_at:string};

async function setup(){
 if(isPostgres())return;
 await E.DB.prepare(`CREATE TABLE IF NOT EXISTS product_reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  author TEXT NOT NULL,
  rating INTEGER NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  ip_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
 )`).run();
}
async function authorized(request:Request){
 if(localAdminAccess(request))return true;
 if(!E.ADMIN_PASSWORD)return false;
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('skp-session:'+E.ADMIN_PASSWORD));
 const token=Array.from(new Uint8Array(bytes)).map(x=>x.toString(16).padStart(2,'0')).join('');
 return (request.headers.get('cookie')||'').split(';').some(x=>x.trim()==='skp_admin='+token);
}
const json=(body:object,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(request:Request){
 try{
  await setup();
  const url=new URL(request.url);
  if(url.searchParams.get('admin')==='1'){
   if(!await authorized(request))return json({error:'Требуется вход в админ-панель'},401);
   const result=await E.DB.prepare("SELECT id,product_id,author,rating,body,status,created_at FROM product_reviews ORDER BY created_at DESC LIMIT 250").all<ReviewRow>();
   return json({reviews:result.results||[]});
  }
  const id=url.searchParams.get('productId')||'';
  if(!/^[a-zA-Z0-9_-]{1,90}$/.test(id))return json({reviews:[]});
  const result=await E.DB.prepare("SELECT id,product_id,author,rating,body,created_at FROM product_reviews WHERE product_id=? AND status='approved' ORDER BY created_at DESC LIMIT 100").bind(id).all<ReviewRow>();
  return json({reviews:result.results||[]});
 }catch{return json({error:'Не удалось загрузить отзывы'},503)}
}
export async function POST(request:Request){
 try{
  if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Запрос с другого сайта запрещён'},403);
  if(!(request.headers.get('content-type')||'').includes('application/json'))return json({error:'Неверный формат'},415);
  const raw=await request.text();
  if(raw.length>4000)return json({error:'Запрос слишком большой'},413);
  const data=JSON.parse(raw);
  await setup();
  if(data.action==='moderate'){
   if(!await authorized(request))return json({error:'Требуется вход в админ-панель'},401);
   if(typeof data.id!=='string'||!/^[0-9a-f-]{36}$/.test(data.id)||!['approved','rejected'].includes(data.status))return json({error:'Неверные данные'},400);
   await E.DB.prepare("UPDATE product_reviews SET status=? WHERE id=?").bind(data.status,data.id).run();
   return json({ok:true});
  }
  if(data.action!=='submit')return json({error:'Неизвестное действие'},400);
  if(data.website)return json({ok:true,pending:true});
  const productId=typeof data.productId==='string'?data.productId.trim():'';
  const author=typeof data.author==='string'?data.author.trim():'';
  const body=typeof data.body==='string'?data.body.trim():'';
  const rating=Number(data.rating);
  if(!/^[a-zA-Z0-9_-]{1,90}$/.test(productId)||author.length<2||author.length>60||
     body.length<15||body.length>1200||!Number.isInteger(rating)||rating<1||rating>5)
    return json({error:'Проверьте имя, оценку и текст (15–1200 символов)'},400);
  if(/https?:\/\/|www\.|t\.me\/|<[^>]+>/.test(body))return json({error:'Ссылки в отзывах не допускаются'},400);
  const ip=request.headers.get('cf-connecting-ip')||request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip+':'+(E.ADMIN_PASSWORD||'skp-reviews')));
  const ipHash=Array.from(new Uint8Array(digest)).map(n=>n.toString(16).padStart(2,'0')).join('');
  const attempts=await E.DB.prepare("SELECT count(*) AS total FROM product_reviews WHERE ip_hash=? AND created_at>datetime('now','-24 hours')").bind(ipHash).first<{total:number}>();
  if((attempts?.total||0)>=3)return json({error:'Превышен лимит: не более трёх отзывов в сутки'},429);
  await E.DB.prepare("INSERT INTO product_reviews (id,product_id,author,rating,body,status,ip_hash) VALUES (?,?,?,?,?,'pending',?)")
    .bind(crypto.randomUUID(),productId,author,rating,body,ipHash).run();
  return json({ok:true,pending:true});
 }catch{return json({error:'Не удалось обработать отзыв'},503)}
}
