'use client';
import {useCallback,useEffect,useState} from 'react';

type Employee={id:string;display_name:string;role:'owner'|'admin';status:'active'|'blocked';created_at:string};
export default function StaffPage(){
 const [users,setUsers]=useState<Employee[]>([]);
 const [name,setName]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [ready,setReady]=useState(false);
 const [inviteLink,setInviteLink]=useState('');
 const load=useCallback(async()=>{
  const response=await fetch('/api/admin/staff',{cache:'no-store',credentials:'same-origin'});
  if(!response.ok)throw new Error(response.status===403?'Доступ только для владельца.':'Не удалось получить список сотрудников.');
  const data=await response.json() as {users:Employee[]};
  setUsers(data.users);setReady(true);
 },[]);
 useEffect(()=>{void load().catch(e=>{setError(e instanceof Error?e.message:'Ошибка загрузки');setReady(true)})},[load]);
 async function act(payload:Record<string,string>){
  if(busy)return;
  setBusy(true);setError('');setInviteLink('');
  try{
   const response=await fetch('/api/admin/staff',{method:'POST',credentials:'same-origin',
    headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   if(!response.ok)throw new Error(response.status===403?'Нет прав владельца.':'Операция не выполнена.');
   if(payload.action==='invite'){
    const result=await response.json() as {inviteToken:string};
    setInviteLink(window.location.origin+'/admin/invite?token='+encodeURIComponent(result.inviteToken));
   }
   await load();setName('');
  }catch(e){setError(e instanceof Error?e.message:'Ошибка')}
  finally{setBusy(false)}
 }
 return <main style={{minHeight:'100dvh',background:'#080808',color:'#fff',padding:'clamp(20px,5vw,56px)'}}>
  <div style={{maxWidth:900,margin:'0 auto'}}>
   <a href="/admin" style={{color:'#ffd22e',textDecoration:'none'}}>← Админ-панель</a>
   <h1 style={{fontSize:'clamp(28px,4vw,40px)',margin:'24px 0 8px'}}>Сотрудники и доступ</h1>
   <p style={{color:'#aaa',lineHeight:1.6}}>Только владелец может создавать учётные записи и блокировать сотрудников. Новая запись не предоставляет доступ, пока не зарегистрирован персональный Passkey.</p>
   {error&&<p role="alert" style={{color:'#ff9999'}}>{error}</p>}
   {inviteLink&&<aside style={{padding:18,border:'1px solid #555',borderRadius:12,display:'grid',gap:12}}>
    <strong>Приглашение действительно 15 минут</strong>
    <p style={{color:'#aaa',margin:0}}>Передайте ссылку только нужному сотруднику. Любой получивший её сможет зарегистрировать Passkey до истечения срока.</p>
    <input aria-label="Ссылка приглашения" readOnly value={inviteLink} style={{width:'100%',padding:12,background:'#1b1b1b',color:'#fff',border:'1px solid #555',borderRadius:8}}/>
    <button type="button" onClick={()=>void navigator.clipboard.writeText(inviteLink)} style={{background:'#ffd22e',border:0,borderRadius:8,padding:12,fontWeight:700}}>Скопировать ссылку</button>
   </aside>}
   {ready&&<form onSubmit={e=>{e.preventDefault();void act({action:'create',displayName:name.trim()})}}
    style={{display:'flex',gap:12,flexWrap:'wrap',margin:'30px 0'}}>
    <input aria-label="Имя сотрудника" required minLength={1} maxLength={120} value={name}
     onChange={e=>setName(e.target.value)} placeholder="Имя нового администратора"
     style={{flex:'1 1 250px',background:'#191919',color:'#fff',border:'1px solid #555',borderRadius:10,padding:14}}/>
    <button type="submit" disabled={busy||!name.trim()} style={{background:'#ffd22e',color:'#080808',border:0,borderRadius:10,padding:'14px 22px',fontWeight:700,opacity:busy?.5:1}}>Добавить сотрудника</button>
   </form>}
   <section aria-label="Список сотрудников" style={{display:'grid',gap:12}}>
    {users.map(user=><article key={user.id} style={{display:'flex',gap:16,justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',border:'1px solid #333',borderRadius:12,padding:18}}>
     <div><strong>{user.display_name}</strong><div style={{color:'#aaa',fontSize:13,marginTop:6}}>{user.role==='owner'?'Владелец':'Администратор'} · {user.status==='active'?'Активен':'Заблокирован'}</div></div>
     {user.role==='admin'&&user.status==='active'&&<div style={{display:'flex',gap:10,flexWrap:'wrap'}}><button type="button" disabled={busy}
      onClick={()=>void act({action:'invite',userId:user.id})}
      style={{background:'#ffd22e',color:'#111',border:0,borderRadius:8,padding:'10px 16px',fontWeight:700}}>Пригласить</button><button type="button" disabled={busy}
      onClick={()=>{if(window.confirm('Заблокировать сотрудника и отозвать все его сессии и Passkey?'))void act({action:'block',userId:user.id})}}
      style={{background:'transparent',color:'#ffaaaa',border:'1px solid #854444',borderRadius:8,padding:'10px 16px'}}>Заблокировать</button></div>}
    </article>)}
   </section>
  </div>
 </main>;
}
