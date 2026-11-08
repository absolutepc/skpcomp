'use client';
import {useState} from 'react';
type Result={unboundPasskeys:number;boundPasskeys:number;activeOwners:number};
export default function PasskeyDiagnostics(){
 const [password,setPassword]=useState('');
 const [busy,setBusy]=useState(false);
 const [result,setResult]=useState<Result|null>(null);
 const [error,setError]=useState('');
 async function check(){
  if(busy||!password)return;
  setBusy(true);setError('');setResult(null);
  try{
   const response=await fetch('/api/admin/passkey/diagnostics',{
    method:'POST',credentials:'same-origin',cache:'no-store',
    headers:{'Content-Type':'application/json'},body:JSON.stringify({password}),
   });
   setPassword('');
   if(!response.ok)throw Error(response.status===403?'Нужна действующая сессия администратора и правильный пароль.':response.status===404?'Диагностика доступна только в изолированной тестовой версии.':'Диагностика временно недоступна.');
   setResult(await response.json() as Result);
  }catch(e){setError(e instanceof Error?e.message:'Ошибка проверки.')}
  finally{setPassword('');setBusy(false);}
 }
 return <main style={{minHeight:'100dvh',background:'#080808',color:'#fff',padding:24,display:'grid',placeItems:'center'}}>
 <section style={{width:'100%',maxWidth:460,display:'grid',gap:16}}>
 <h1>SKP — проверка привязки Passkey</h1>
 <p>Только чтение. Ключи и права доступа не изменяются.</p>
 <label>Пароль администратора<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} style={{display:'block',width:'100%',padding:12,marginTop:8,background:'#222',color:'#fff',border:'1px solid #666',borderRadius:8}}/></label>
 <button type="button" onClick={()=>void check()} disabled={busy||!password} style={{padding:14,background:'#ffd22e',color:'#111',border:0,borderRadius:8,fontWeight:700}}>{busy?'Проверяем…':'Проверить привязку'}</button>
 {result&&<section aria-live="polite" style={{display:'grid',gap:8}}><p>Ключей без привязки: {result.unboundPasskeys}</p><p>Привязанных ключей: {result.boundPasskeys}</p><p>Активных владельцев: {result.activeOwners}</p></section>}
 <p role="alert">{error}</p><a href="/admin" style={{color:'#ffd22e'}}>Вернуться в админку</a>
 </section></main>;
}
