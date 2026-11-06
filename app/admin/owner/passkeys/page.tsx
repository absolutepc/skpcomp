'use client';
import {useEffect,useState} from 'react';

type Credential={device_label:string;created_at:string;last_used_at:string|null;status:'active'|'revoked'};
const date=(value:string|null)=>value?new Date(value).toLocaleString('ru-RU'):'Ещё не использовался';
export default function OwnerPasskeysPage(){
 const [items,setItems]=useState<Credential[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 useEffect(()=>{
  const controller=new AbortController();
  fetch('/api/admin/owner/passkeys',{credentials:'same-origin',cache:'no-store',signal:controller.signal})
   .then(async response=>{
    if(!response.ok)throw Error(response.status===403?'Доступно только владельцу SKP.':'Не удалось загрузить список ключей.');
    return response.json() as Promise<{passkeys:Credential[]}>;
   })
   .then(data=>{if(!controller.signal.aborted)setItems(data.passkeys)})
   .catch(()=>{if(!controller.signal.aborted)setError('Не удалось получить список ключей. Проверьте авторизацию владельца.')})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false)});
  return ()=>controller.abort();
 },[]);
 return <main style={{minHeight:'100dvh',background:'#080808',color:'#fff',padding:'36px 20px'}}>
  <section style={{maxWidth:760,margin:'0 auto'}}>
   <a href="/admin/staff" style={{color:'#ffd22e'}}>← Управление сотрудниками</a>
   <h1 style={{marginTop:28}}>Ключи доступа владельца</h1>
   <p style={{color:'#aaa',lineHeight:1.6}}>Здесь отображаются Passkey, привязанные к учётной записи владельца. Резервный ключ необходимо зарегистрировать и проверить отдельно. Наличие ключа в списке само по себе не подтверждает готовность восстановления.</p>
   {loading?<p role="status">Загрузка…</p>:error?<p role="alert">{error}</p>:items.length===0?
    <p>Зарегистрированных ключей пока нет.</p>:
    <div style={{display:'grid',gap:12}}>{items.map((item,i)=><article key={i} style={{border:'1px solid #333',borderRadius:12,padding:18,background:'#151515'}}>
     <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
      <strong>{item.device_label||'Ключ без названия'}</strong>
      <span style={{color:item.status==='active'?'#ffd22e':'#aaa'}}>{item.status==='active'?'Активен':'Отозван'}</span>
     </div>
     <p style={{color:'#aaa',fontSize:14}}>Создан: {date(item.created_at)}</p>
     <p style={{color:'#aaa',fontSize:14}}>Последний вход: {date(item.last_used_at)}</p>
    </article>)}</div>}
   <p style={{color:'#aaa',marginTop:28,fontSize:14}}>Добавление и отзыв резервных ключей появятся после проверки защищённой процедуры регистрации. Пока изменения ключей с этой страницы недоступны.</p>
  </section>
 </main>;
}
