import {env} from 'cloudflare:workers';
import {seed} from '../../../lib/seed';
const E=env as unknown as {DB:D1Database;ADMIN_PASSWORD:string};
async function token(){let a=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('skp-session:'+E.ADMIN_PASSWORD));return Array.from(new Uint8Array(a)).map(x=>x.toString(16).padStart(2,'0')).join('')}
async function auth(r:Request){return !!E.ADMIN_PASSWORD && (r.headers.get('cookie')||'').split(';').map(x=>x.trim()).includes('skp_admin='+await token())}
export async function GET(){
 const row=await E.DB.prepare('SELECT value FROM shop WHERE id=?').bind('catalog').first<{value:string}>();
 const store=row?JSON.parse(row.value) as typeof seed:seed;
 // Upgrade legacy catalogs without replacing prices, availability, contacts or admin changes.
 // The version is saved along with the catalog on the next admin edit, so intentional deletions stay deleted.
 if(row&&(store.catalogVersion||0)<1){
  const white=seed.products.find(p=>p.id==='mouse')!;
  const black=seed.products.find(p=>p.id==='logitech-pro-x-superlight-2-black')!;
  const products=store.products.map(p=>p.id==='mouse'&&p.name.toLowerCase().includes('superlight 2')?{
   ...p,name:p.name==='Logitech G Pro X Superlight 2'?white.name:p.name,category:'mouse',image:p.image||white.image,
   variantGroup:white.variantGroup,colorHex:white.colorHex,
   specs:{...white.specs,...p.specs,color:'Белый'}
  }:p);
  if(!products.some(p=>p.id==='mouse'))products.push(white);
  if(!products.some(p=>p.id===black.id))products.push(black);
  return Response.json({...store,products,catalogVersion:1},{headers:{'Cache-Control':'no-store'}});
 }
 return Response.json(store,{headers:{'Cache-Control':'no-store'}});
}
export async function POST(r:Request){if(r.headers.get('origin')!==new URL(r.url).origin)return new Response('Forbidden',{status:403});const b=await r.json() as any;
if(b.action==='login'){if(!E.ADMIN_PASSWORD||b.password!==E.ADMIN_PASSWORD)return Response.json({error:'Неверный пароль'},{status:401});return Response.json({ok:true},{headers:{'Set-Cookie':'skp_admin='+await token()+'; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800'}})}
if(b.action==='logout')return Response.json({ok:true},{headers:{'Set-Cookie':'skp_admin=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'}});
if(!await auth(r))return Response.json({error:'Войдите в административную панель'},{status:401});if(b.action==='check')return Response.json({ok:true});
const d=b.data;if(!d||!Array.isArray(d.products)||d.products.length>1000)return Response.json({error:'Некорректный каталог'},{status:400});
if(d.products.some((p:any)=>!p.id||!p.name||!Number.isFinite(p.price)||p.price<0||(!/^https:\/\//.test(p.image)&&p.image!=='')))return Response.json({error:'Проверьте названия, цены и HTTPS-ссылки фотографий'},{status:400});
if(d.products.some((p:any)=>p.specs!==undefined&&(!p.specs||typeof p.specs!=='object'||Array.isArray(p.specs)||Object.keys(p.specs).length>80||Object.entries(p.specs).some(([k,v])=>k.length>50||typeof v!=='string'||v.length>300))))return Response.json({error:'Проверьте характеристики товаров'},{status:400});
if(d.products.some((p:any)=>(p.variantGroup!==undefined&&(typeof p.variantGroup!=='string'||p.variantGroup.length>80))||(p.colorHex!==undefined&&(typeof p.colorHex!=='string'||!/^#[0-9a-fA-F]{6}$/.test(p.colorHex)))))return Response.json({error:'Проверьте группу вариантов и HEX-код цвета'},{status:400});
if(d.instagram&&!/^https:\/\/(www\.)?instagram\.com\//.test(d.instagram))return Response.json({error:'Введите ссылку Instagram'},{status:400});if(d.whatsapp&&!/^\d{10,15}$/.test(d.whatsapp))return Response.json({error:'Номер WhatsApp: 10–15 цифр без плюса'},{status:400});
await E.DB.prepare('INSERT INTO shop (id,value) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value').bind('catalog',JSON.stringify(d)).run();return Response.json({ok:true});}
