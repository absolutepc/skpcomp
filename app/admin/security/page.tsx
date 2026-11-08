'use client';
import {useEffect,useState} from 'react';
import QRCode from 'qrcode';
import Link from 'next/link';
import {ArrowLeft,KeyRound,ShieldCheck,RefreshCw} from 'lucide-react';

type KeyInfo={fingerprint:string;device_label:string;created_at:string;last_used_at:string|null;status:'active'|'revoked'};
type Inventory={passkeys:KeyInfo[];backupVerified:boolean};
type Challenge={challenge:string;rpID:string;allowCredentials?:{id:string;type:string;transports?:AuthenticatorTransport[]}[]};
const decode=(s:string)=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4)),c=>c.charCodeAt(0));
const hexChallenge=(s:string)=>{if(!/^[a-f0-9]{64}$/.test(s))throw Error('Неверный запрос подтверждения');return Uint8Array.from(s.match(/.{2}/g)!,x=>parseInt(x,16));};
const encode=(bytes:ArrayBuffer)=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
async function post<T>(url:string,body:object):Promise<T>{
 const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',cache:'no-store',body:JSON.stringify(body)});
 const data=await res.json().catch(()=>({})) as T & {error?:string};
 if(!res.ok)throw Error(data.error||'Ошибка запроса ('+res.status+')');
 return data;
}
async function authenticate(options:Challenge,discoverable=false){
 const credential=await navigator.credentials.get({publicKey:{
  challenge:hexChallenge(options.challenge),rpId:options.rpID,userVerification:'required',
  allowCredentials:discoverable?[]:(options.allowCredentials||[]).map(c=>({type:'public-key' as const,id:decode(c.id),transports:c.transports})),
  timeout:110000,
 }}) as PublicKeyCredential|null;
 if(!credential)throw Error('Подтверждение не выполнено');
 const response=credential.response as AuthenticatorAssertionResponse;
 return {id:credential.id,rawId:encode(credential.rawId),type:'public-key',response:{
  clientDataJSON:encode(response.clientDataJSON),authenticatorData:encode(response.authenticatorData),
  signature:encode(response.signature),userHandle:response.userHandle?encode(response.userHandle):undefined,
 },clientExtensionResults:credential.getClientExtensionResults()};
}
async function register(options:Challenge){
 const credential=await navigator.credentials.create({publicKey:{
  challenge:hexChallenge(options.challenge),rp:{id:options.rpID,name:'SKP Admin'},
  user:{id:crypto.getRandomValues(new Uint8Array(32)),name:'SKP Owner backup',displayName:'SKP Owner backup'},
  pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],
  authenticatorSelection:{userVerification:'required',residentKey:'preferred'},
  attestation:'none',timeout:60000,
 }}) as PublicKeyCredential|null;
 if(!credential)throw Error('Ключ не создан');
 const response=credential.response as AuthenticatorAttestationResponse;
 return {id:credential.id,rawId:encode(credential.rawId),type:'public-key',response:{
  clientDataJSON:encode(response.clientDataJSON),attestationObject:encode(response.attestationObject),
  transports:response.getTransports?.()||[],
 },clientExtensionResults:credential.getClientExtensionResults()};
}
export default function AdminSecurityPage(){
 const [data,setData]=useState<Inventory|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');
 const [label,setLabel]=useState('');
 const [qr,setQr]=useState<{requestToken:string;desktopSecret:string;expiresAt:number;approvalUrl:string;image:string}|null>(null);
 useEffect(()=>{
  if(!qr)return;
  let active=true;
  const poll=async()=>{
   if(Date.now()>qr.expiresAt*1000){if(active){setError('Время действия QR-кода истекло. Создайте новый.');setQr(null);}return;}
   try{
    const result=await post<{status:string}>('/api/admin/owner/qr-check/status',{requestToken:qr.requestToken,desktopSecret:qr.desktopSecret});
    if(active&&result.status==='approved'){setQr(null);setMessage('Passkey владельца успешно проверен через iPhone.');void refresh();}
    else if(active&&result.status==='expired'){setQr(null);setError('Время действия QR-кода истекло.');}
   }catch{if(active){setQr(null);setError('Не удалось проверить статус QR-кода.');}}
  };
  const timer=setInterval(()=>void poll(),2000);
  return ()=>{active=false;clearInterval(timer);};
 },[qr]);
 async function beginQrCheck(fingerprint:string){
  if(busy)return;
  setBusy(true);setError('');setMessage('');setQr(null);
  try{
   const result=await post<{requestToken:string;desktopSecret:string;expiresAt:number;approvalUrl:string}>('/api/admin/owner/qr-check/create',{fingerprint});
   const image=await QRCode.toDataURL(result.approvalUrl,{width:260,margin:2,color:{dark:'#08090b',light:'#ffffff'}});
   setQr({...result,image});
  }catch(e){setError(e instanceof Error?e.message:'Не удалось создать QR-код');}
  finally{setBusy(false);}
 }
 async function refresh(){
  const res=await fetch('/api/admin/owner/passkeys',{credentials:'same-origin',cache:'no-store'});
  if(!res.ok)throw Error(res.status===403?'Войдите в админ-панель как владелец.':'Не удалось получить список ключей');
  setData(await res.json() as Inventory);
 }
 useEffect(()=>{void refresh().catch(e=>setError(String(e.message||e)));},[]);
 async function stepUp(action:'owner-passkey-enroll'|'owner-passkey-test',fingerprint?:string){
  const options=await post<Challenge>('/api/admin/owner/step-up/options',{action,...(fingerprint?{fingerprint}:{})});
  const response=await authenticate(options,action==='owner-passkey-test');
  const result=await post<{verified:boolean}>('/api/admin/owner/step-up/complete',{
   challenge:options.challenge,response,action,...(fingerprint?{fingerprint}:{})
  });
  if(!result.verified)throw Error('Не удалось подтвердить основной ключ');
 }
 async function perform(work:()=>Promise<void>){
  if(busy)return;setBusy(true);setError('');setMessage('');
  try{await work();await refresh();}catch(e){setError(e instanceof Error?e.message:'Ошибка операции');}
  finally{setBusy(false);}
 }
 const active=data?.passkeys.filter(k=>k.status==='active')||[];
 return <main style={{minHeight:'100vh',background:'#08090b',color:'#f4f4f4',padding:'clamp(20px,5vw,64px)',fontFamily:'inherit'}}>
  <div style={{maxWidth:820,margin:'0 auto'}}>
   <Link href="/admin" style={{display:'inline-flex',gap:8,alignItems:'center',color:'#e8dc54',textDecoration:'none'}}><ArrowLeft size={18}/> В админ-панель</Link>
   <header style={{margin:'34px 0 28px'}}>
    <div style={{display:'flex',alignItems:'center',gap:12}}><ShieldCheck color="#e8dc54"/><h1 style={{fontSize:30,margin:0}}>Безопасность владельца</h1></div>
    <p style={{color:'#a7a9ae',lineHeight:1.6}}>Проверка ключей и безопасная смена телефона. Пароль владельца остаётся доступным.</p>
   </header>
   <section style={{border:'1px solid #35383c',borderRadius:18,padding:24,background:'#141619'}}>
    <h2 style={{fontSize:19,margin:'0 0 8px'}}>Зарегистрированные ключи</h2>
    <p style={{color:'#a7a9ae',fontSize:14}}>{data?active.length+' активных · '+(data.backupVerified?'резервный вход проверен':'резервный вход ещё не подтверждён'):'Загрузка…'}</p>
    {data?.passkeys.map(k=><div key={k.fingerprint} style={{borderTop:'1px solid #33363a',padding:'17px 0',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
     <div><div style={{display:'flex',alignItems:'center',gap:9}}><KeyRound size={18} color="#e8dc54"/><strong>{k.device_label||'Passkey владельца'}</strong></div>
      <div style={{color:'#a7a9ae',fontSize:13,marginTop:6}}>{k.status==='revoked'?'Отозван':k.last_used_at?'Использовался':'Ещё не проверен'} · {new Date(k.created_at).toLocaleDateString('ru-RU')}</div></div>
     {k.status==='active'&&<button disabled={busy} onClick={()=>void beginQrCheck(k.fingerprint)} style={{padding:'10px 14px',borderRadius:9,border:'1px solid #555',background:'#24272b',color:'#fff',cursor:'pointer'}}>Проверить ключ</button>}
    </div>)}
   </section>
   {qr&&<section style={{marginTop:18,border:'1px solid #e8dc54',borderRadius:18,padding:24,background:'#141619',textAlign:'center'}}><h2>Подтверждение с iPhone</h2><p style={{color:'#aaa'}}>Откройте камеру iPhone, отсканируйте QR-код, затем нажмите «Подтвердить через Face ID» на открывшейся странице SKP.</p><img src={qr.image} alt="QR-код проверки Passkey владельца" width={260} height={260} style={{display:'block',margin:'16px auto',borderRadius:10}}/><p style={{color:'#aaa',fontSize:13}}>QR-код действует до {new Date(qr.expiresAt*1000).toLocaleTimeString('ru-RU')}. Статус обновляется автоматически.</p><button onClick={()=>setQr(null)} style={{background:'#24272b',border:'1px solid #555',color:'#fff',padding:'10px 16px',borderRadius:9}}>Отмена</button></section>}
   <section style={{border:'1px solid #35383c',borderRadius:18,padding:24,background:'#141619',marginTop:18}}>
    <h2 style={{fontSize:19,margin:'0 0 10px'}}>Смена телефона владельца</h2>
    <p style={{color:'#a7a9ae',fontSize:14,lineHeight:1.6}}>Перед продажей старого телефона убедитесь, что новый телефон может войти в SKP. При синхронизации через iCloud один Passkey может работать на обоих устройствах — его отзыв в SKP отключит оба.</p>
    <ol style={{color:'#d0d1d4',lineHeight:1.9,paddingLeft:22}}>
     <li>Настройте новый телефон и синхронизацию Passkey.</li>
     <li>На новом телефоне подтвердите QR-вход SKP с другого браузера или компьютера.</li>
     <li>Убедитесь, что админ-панель открылась и пароль владельца доступен.</li>
     <li>Только после проверки выйдите из Apple Account на старом телефоне и сотрите его данные перед продажей.</li>
    </ol>
    <p style={{color:'#e8dc54',fontSize:14,lineHeight:1.6}}>Добавление отдельного ключа для нового устройства и отзыв старого пока не включены. Не удаляйте единственный действующий Passkey.</p>
   </section>
   {error&&<p role="alert" style={{color:'#ff8b8b',marginTop:20}}>{error}</p>}
   {message&&<p role="status" style={{color:'#e8dc54',marginTop:20}}>{message}</p>}
   <button disabled={busy} onClick={()=>void perform(async()=>{setMessage('Список обновлён');})} style={{display:'flex',alignItems:'center',gap:8,marginTop:22,background:'transparent',color:'#aaa',border:'none',cursor:'pointer'}}><RefreshCw size={16}/> Обновить список</button>
  </div>
 </main>;
}
