'use client';
import {useEffect,useRef,useState} from 'react';

type QrRequest={requestToken:string;desktopSecret:string;expiresAt:number;approvalUrl:string};
type Status='pending'|'approved'|'denied'|'expired'|'consumed'|string;
function isTrustedApprovalUrl(raw:string,requestToken:string){
 try{
  const url=new URL(raw);
  return url.origin===window.location.origin
   &&url.pathname==='/admin/qr/approve'
   &&url.searchParams.size===1
   &&url.searchParams.getAll('request').length===1
   &&url.searchParams.get('request')===requestToken
   &&!url.hash&&!url.username&&!url.password;
 }catch{return false;}
}
export default function AdminQrLogin({onAuthenticated}:{onAuthenticated:()=>void}){
 const [request,setRequest]=useState<QrRequest|null>(null);
 const [status,setStatus]=useState<Status>('pending');
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [qrDataUrl,setQrDataUrl]=useState('');
 const [qrError,setQrError]=useState('');
 const onAuthenticatedRef=useRef(onAuthenticated);
 const requestGeneration=useRef(0);
 const canApprove=Boolean(request&&status==='pending'&&request.expiresAt*1000>Date.now());
 useEffect(()=>{onAuthenticatedRef.current=onAuthenticated;},[onAuthenticated]);
 async function start(){
  if(busy)return;
  const generation=++requestGeneration.current;
  setBusy(true);setError('');setRequest(null);setStatus('pending');
  try{
   const response=await fetch('/api/admin/qr/create',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',cache:'no-store',credentials:'same-origin'});
   if(!response.ok)throw Error(response.status===429?'Слишком много запросов. Попробуйте позже.':'Не удалось создать запрос входа.');
   const value=await response.json() as QrRequest;
   if(!/^[a-f0-9]{64}$/.test(value.requestToken)||!/^[a-f0-9]{64}$/.test(value.desktopSecret)||!Number.isFinite(value.expiresAt)||value.expiresAt*1000<=Date.now()||!isTrustedApprovalUrl(value.approvalUrl,value.requestToken))throw Error('Некорректный ответ сервера.');
   if(generation===requestGeneration.current)setRequest(value);
  }catch(e){if(generation===requestGeneration.current)setError(e instanceof Error?e.message:'Ошибка соединения');}
  finally{if(generation===requestGeneration.current)setBusy(false);}
 }
 useEffect(()=>{
  let active=true;
  setQrDataUrl('');
  setQrError('');
  if(!request||status!=='pending'||request.expiresAt*1000<=Date.now())return()=>{active=false;};
  // Encode the approval URL entirely in the browser: never send it to an external QR API.
  import('qrcode').then(({default:QRCode})=>QRCode.toDataURL(request.approvalUrl,{
   errorCorrectionLevel:'M',margin:3,width:264,
   color:{dark:'#101010',light:'#ffffff'},
  })).then(url=>{if(active)setQrDataUrl(url);}).catch(()=>{
   if(active)setQrError('Не удалось показать QR-код. Используйте ссылку ниже.');
  });
  return()=>{active=false;};
 },[request,status]);
 useEffect(()=>{
  if(!request)return;
  let active=true,working=false,finished=false,terminal=false;
  // The server uses epoch seconds. Never poll or consume after expiry.
  const expiresAtMs=request.expiresAt*1000;
  // Expire the QR locally even if the status endpoint hangs or the network drops.
  const expiryTimer=setTimeout(()=>{if(active){terminal=true;setStatus('expired');}},Math.max(0,expiresAtMs-Date.now()));
  const poll=async()=>{
   if(!active||working||finished||terminal)return;
   if(Date.now()>=expiresAtMs){terminal=true;setStatus('expired');return;}
   working=true;
   try{
    const response=await fetch('/api/admin/qr/status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestToken:request.requestToken,desktopSecret:request.desktopSecret}),cache:'no-store',credentials:'same-origin'});
    if(!response.ok)throw Error('Не удалось проверить подтверждение.');
    const result=await response.json() as {status:Status};
    if(!active||terminal)return;
    if(Date.now()>=expiresAtMs){terminal=true;setStatus('expired');return;}
    // A recovered connection should clear an earlier transient polling error.
    setError('');
    setStatus(result.status);
    if(['denied','expired','consumed'].includes(result.status)){terminal=true;return;}
    if(result.status!=='pending'&&result.status!=='approved')throw Error('Неизвестное состояние QR-запроса.');
    if(result.status==='approved'){
     finished=true;
     const consumed=await fetch('/api/admin/qr/consume',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestToken:request.requestToken,desktopSecret:request.desktopSecret}),cache:'no-store',credentials:'same-origin'});
     // A successful consume may finish after the local QR deadline; the server
     // has already enforced expiry atomically, so its session result wins.
     if(!active)return;
     if(!consumed.ok)throw Error('Подтверждение получено, но завершить вход не удалось.');
     const session=await consumed.json() as {authenticated?:boolean};
     if(session.authenticated!==true)throw Error('Сервер не подтвердил создание сессии.');
     if(active){active=false;onAuthenticatedRef.current();}
    }
   }catch(e){if(active){setError(e instanceof Error?e.message:'Ошибка соединения');if(finished){terminal=true;setStatus('error');}}}
   finally{working=false;}
  };
  void poll();
  const timer=setInterval(()=>{void poll();},2500);
  return()=>{active=false;clearInterval(timer);clearTimeout(expiryTimer);};
 },[request]);
 return <div className="skp-admin-qr-login">
  <h3>Вход с iPhone</h3>
  <p>Подтвердите вход с помощью зарегистрированного Passkey. Пароль по-прежнему доступен.</p>
  {!request?<button type="button" className="button outline" disabled={busy} onClick={()=>void start()}>{busy?'Создаём запрос…':'Войти через iPhone'}</button>:<>
   <p role="status">{status==='pending'?'Ожидание подтверждения на iPhone':status==='approved'?'Завершаем вход…':status==='denied'?'Запрос отклонён':status==='expired'?'Время запроса истекло':status==='consumed'?'Запрос уже использован':status==='error'?'Не удалось завершить вход. Создайте новый запрос.':'Статус: '+status}</p>
   {canApprove&&<div style={{display:'flex',justifyContent:'center',margin:'16px 0'}}>
    {qrDataUrl?<img src={qrDataUrl} alt="QR-код для подтверждения входа в SKP на iPhone" width={264} height={264} style={{display:'block',maxWidth:'100%',borderRadius:12}}/>:
     <p role="status">{qrError||'Создаём QR-код…'}</p>}
   </div>}
   {canApprove&&<a href={request.approvalUrl} target="_blank" rel="noopener noreferrer">Открыть страницу подтверждения на iPhone</a>}
   {canApprove&&<button type="button" className="button outline" onClick={()=>{if(request.expiresAt*1000<=Date.now()){setStatus('expired');return;}void navigator.clipboard.writeText(request.approvalUrl).catch(()=>setError('Не удалось скопировать ссылку. Откройте её вручную.'));}}>Скопировать ссылку для iPhone</button>}
   {canApprove&&<p><small>Отсканируйте QR-код камерой iPhone и подтвердите вход через Face ID / Passkey. Если сканирование недоступно, откройте ссылку в Safari.</small></p>}
   <button type="button" className="button outline" disabled={busy} onClick={()=>void start()}>Создать новый запрос</button>
  </>}
  {error&&<p role="alert">{error}</p>}
 </div>;
}
