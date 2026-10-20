'use client';
import {useEffect,useState} from 'react';
import {Star,Send,Check,X} from 'lucide-react';

type Review={id:string;product_id:string;author:string;rating:number;body:string;created_at:string;status?:string};
const stars=(n:number)=>'★'.repeat(n)+'☆'.repeat(5-n);
export default function ProductReviews({productId}:{productId:string}){
 const [reviews,setReviews]=useState<Review[]>([]);
 const [name,setName]=useState('');
 const [rating,setRating]=useState(5);
 const [body,setBody]=useState('');
 const [website,setWebsite]=useState('');
 const [loading,setLoading]=useState(false);
 const [message,setMessage]=useState('');
 useEffect(()=>{
  let active=true;setReviews([]);setMessage('');
  fetch('/api/reviews?productId='+encodeURIComponent(productId)).then(r=>r.json()).then(raw=>{const d=raw as {reviews?:Review[]};if(active)setReviews(Array.isArray(d.reviews)?d.reviews:[])}).catch(()=>{if(active)setMessage('Отзывы пока не удалось загрузить')});
  return()=>{active=false};
 },[productId]);
 const mean=reviews.length?(reviews.reduce((sum,r)=>sum+r.rating,0)/reviews.length).toFixed(1):null;
 async function send(e:React.FormEvent){
  e.preventDefault();setLoading(true);setMessage('');
  try{
   const r=await fetch('/api/reviews',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'submit',productId,author:name,rating,body,website})});
   const d=await r.json() as {error?:string;reviews?:Review[]};
   if(!r.ok)throw Error(d.error||'Не удалось сохранить отзыв');
   setMessage('Спасибо! Отзыв отправлен на модерацию и появится после проверки.');
   setBody('');setRating(5);setName('');
  }catch(error){setMessage(error instanceof Error?error.message:'Ошибка отправки')}finally{setLoading(false)}
 }
 return <section className="skp-reviews" aria-label="Отзывы о товаре">
 <div className="skp-reviews-heading"><div><span className="eyebrow">SKP / ОТЗЫВЫ</span><h2>Отзывы покупателей</h2></div><div className="skp-review-rating">{mean?<><Star size={18} fill="currentColor"/> {mean} <small>({reviews.length})</small></>:<span>Пока без оценок</span>}</div></div>
 {reviews.length?<div className="skp-review-list">{reviews.map(r=><article className="skp-review" key={r.id}><div><strong>{r.author}</strong><span className="skp-stars" aria-label={r.rating+' из 5'}>{stars(r.rating)}</span></div><small>{r.created_at?.slice(0,10)}</small><p>{r.body}</p></article>)}</div>:<p className="skp-reviews-empty">Пока нет опубликованных отзывов. Поделитесь впечатлениями о товаре.</p>}
 <form className="skp-review-form" onSubmit={send}><h3>Оставить отзыв</h3>
  <label>Ваше имя<input required minLength={2} maxLength={60} value={name} onChange={e=>setName(e.target.value)} placeholder="Как к вам обращаться"/></label>
  <fieldset><legend>Оценка</legend><div className="skp-rating-picker">{[1,2,3,4,5].map(n=><button type="button" key={n} onClick={()=>setRating(n)} aria-label={n+' из 5'} aria-pressed={n===rating}><Star size={26} fill={n<=rating?'currentColor':'none'}/></button>)}</div></fieldset>
  <label>Ваш отзыв<textarea required minLength={15} maxLength={1200} rows={4} value={body} onChange={e=>setBody(e.target.value)} placeholder="Расскажите, что понравилось или что можно улучшить"/></label>
  <label className="skp-review-honeypot" aria-hidden="true">Сайт<input tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)}/></label>
  <button className="button light" disabled={loading}>{loading?'Отправляем…':<>Отправить отзыв <Send size={16}/></>}</button>
  <p className="skp-review-note">Отзывы публикуются после модерации. Не указывайте персональные данные и ссылки.</p>
  {message&&<p className="skp-review-message" role="status">{message}</p>}
 </form></section>
}
export function AdminReviews(){
 const [reviews,setReviews]=useState<Review[]>([]);
 const [pending,setPending]=useState(false);
 const [error,setError]=useState('');
 async function load(){setPending(true);try{const r=await fetch('/api/reviews?admin=1',{cache:'no-store'});const d=await r.json() as {error?:string;reviews?:Review[]};if(!r.ok)throw Error(d.error||'Не удалось загрузить отзывы');setReviews(d.reviews||[]);setError('')}catch(e){setError(e instanceof Error?e.message:'Ошибка загрузки')}finally{setPending(false)}}
 useEffect(()=>{void load()},[]);
 async function moderate(id:string,status:'approved'|'rejected'){
  try{const r=await fetch('/api/reviews',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'moderate',id,status})});const d=await r.json() as {error?:string;reviews?:Review[]};if(!r.ok)throw Error(d.error||'Не удалось обновить');setReviews(list=>list.map(item=>item.id===id?{...item,status}:item));setError('')}catch(e){setError(e instanceof Error?e.message:'Ошибка')}
 }
 const queue=reviews.filter(r=>r.status==='pending');
 return <section className="skp-admin-reviews"><div className="section-head"><h2>Отзывы на модерации <span className="muted">/ {queue.length}</span></h2><button type="button" className="button outline" onClick={()=>void load()} disabled={pending}>Обновить</button></div>
 {error&&<p role="alert">{error}</p>}
 {!queue.length?<p className="skp-reviews-empty">{pending?'Загрузка…':'Новых отзывов нет'}</p>:<div className="skp-review-list">{queue.map(r=><article key={r.id} className="skp-review"><div><strong>{r.author}</strong><span className="skp-stars">{stars(r.rating)}</span></div><small>Товар: {r.product_id} · {r.created_at?.slice(0,10)}</small><p>{r.body}</p><div className="skp-admin-review-actions"><button type="button" onClick={()=>void moderate(r.id,'approved')}><Check size={16}/> Опубликовать</button><button type="button" onClick={()=>void moderate(r.id,'rejected')}><X size={16}/> Отклонить</button></div></article>)}</div>}
 </section>;
}
