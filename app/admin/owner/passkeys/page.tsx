'use client';
import {useEffect,useState} from 'react';

type Challenge={challenge:string;rpID:string;expiresAt:number;userVerification:string};
const bytes=(hex:string)=>Uint8Array.from(hex.match(/.{2}/g)||[],v=>parseInt(v,16));
const b64=(buf:ArrayBuffer)=>btoa(String.fromCharCode(...new Uint8Array(buf))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
async function post(path:string,body:unknown={}){const r=await fetch(path,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw Error(r.status===404?'Регистрация доступна только в тестовой среде.':'Операция отклонена сервером.');return r.json()}
function valid(o:Challenge){if(o.rpID!==location.hostname||!/^[a-f0-9]{64}$/.test(o.challenge)||o.expiresAt*1000<=Date.now()||o.userVerification!=='required')throw Error('Некорректный запрос подтверждения.');}
type Credential={device_label:string;created_at:string;last_used_at:string|null;status:'active'|'revoked'};
const date=(value:string|null)=>value?new Date(value).toLocaleString('ru-RU'):'Ещё не использовался';
export default function OwnerPasskeysPage(){
 const [items,setItems]=useState<Credential[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [label,setLabel]=useState('Резервный USB/NFC-ключ');
 const [notice,setNotice]=useState('');
 async function addBackup(){
  if(busy)return;
  if(!window.isSecureContext||!navigator.credentials?.get||!navigator.credentials?.create){setNotice('Требуется HTTPS и браузер с поддержкой Passkey.');return;}
  setBusy(true);setNotice('Подтвердите действующий Passkey владельца.');
  try{
   const step=await post('/api/admin/owner/step-up/options') as Challenge;valid(step);
   const proof=await navigator.credentials.get({publicKey:{challenge:bytes(step.challenge),rpId:step.rpID,userVerification:'required',timeout:60000}}) as PublicKeyCredential|null;
   if(!proof)throw Error('Подтверждение отменено.');
   const a=proof.response as AuthenticatorAssertionResponse;
   await post('/api/admin/owner/step-up/complete',{challenge:step.challenge,response:{id:proof.id,rawId:b64(proof.rawId),type:'public-key',response:{clientDataJSON:b64(a.clientDataJSON),authenticatorData:b64(a.authenticatorData),signature:b64(a.signature),userHandle:a.userHandle?b64(a.userHandle):null},clientExtensionResults:proof.getClientExtensionResults()}});
   setNotice('Теперь подключите резервный USB/NFC-ключ и подтвердите его регистрацию.');
   const options=await post('/api/admin/owner/passkeys/options') as Challenge;valid(options);
   const created=await navigator.credentials.create({publicKey:{challenge:bytes(options.challenge),rp:{id:options.rpID,name:'SKP Admin'},user:{id:bytes(options.challenge),name:'SKP Owner',displayName:'SKP Owner'},pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],authenticatorSelection:{residentKey:'required',userVerification:'required'},attestation:'none',timeout:60000}}) as PublicKeyCredential|null;
   if(!created)throw Error('Регистрация отменена.');
   const a2=created.response as AuthenticatorAttestationResponse;
   const result=await post('/api/admin/owner/passkeys/complete',{challenge:options.challenge,deviceLabel:label.trim().slice(0,100),response:{id:created.id,rawId:b64(created.rawId),type:'public-key',response:{clientDataJSON:b64(a2.clientDataJSON),attestationObject:b64(a2.attestationObject),transports:a2.getTransports?.()||[]},clientExtensionResults:created.getClientExtensionResults()}}) as {registered?:boolean};
   if(!result.registered)throw Error('Сервер не подтвердил регистрацию.');
   setNotice('Ключ зарегистрирован. Для статуса резервного необходимо отдельно проверить вход именно с ним.');
   const refreshed=await fetch('/api/admin/owner/passkeys',{credentials:'same-origin',cache:'no-store'});if(refreshed.ok){const data=await refreshed.json() as {passkeys:Credential[]};setItems(data.passkeys)}
  }catch(e){setNotice(e instanceof Error?e.message:'Не удалось добавить ключ.')}finally{setBusy(false)}
 }

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
   <section style={{marginTop:28,padding:18,border:'1px solid #333',borderRadius:12,display:'grid',gap:12}}>
    <h2>Добавить резервный ключ</h2>
    <p style={{color:'#aaa'}}>Только для тестовой среды. Сначала подтвердите действующий Passkey, затем подключите новый USB/NFC-ключ. Основной ключ не удаляется.</p>
    <label>Название ключа <input value={label} onChange={e=>setLabel(e.target.value)} maxLength={100} style={{display:'block',marginTop:8,padding:12,background:'#202020',color:'#fff',border:'1px solid #555',borderRadius:8,width:'100%'}}/></label>
    <button type='button' disabled={busy} onClick={()=>void addBackup()} style={{padding:14,background:'#ffd22e',color:'#111',border:0,borderRadius:10,fontWeight:700,opacity:busy?.6:1}}>{busy?'Ожидаем подтверждения…':'Добавить резервный Passkey'}</button>
    <p role='status' aria-live='polite'>{notice}</p>
    <p style={{color:'#aaa',fontSize:13}}>После регистрации ключ ещё не считается проверенным резервным средством. Отзыв ключей пока недоступен.</p>
   </section>
  </section>
 </main>;
}
