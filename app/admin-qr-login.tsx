'use client';
import {useEffect,useRef,useState} from 'react';

type QrRequest={requestToken:string;desktopSecret:string;expiresAt:number;approvalUrl:string};
type Status='pending'|'approved'|'rejected'|'expired'|'consumed'|string;
function isTrustedApprovalUrl(raw:string,requestToken:string){
 try{
  const url=new URL(raw);
  return url.origin==='https://skpcomp.vercel.app'
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
 const onAuthenticatedRef=useRef(onAuthenticated);
 const canApprove=Boolean(request&&status==='pending'&&request.expiresAt*1000>Date.now());
 useEffect(()=>{onAuthenticatedRef.current=onAuthenticated;},[onAuthenticated]);
 async function start(){
  setBusy(true);setError('');setRequest(null);setStatus('pending');
  try{
   const response=await fetch('/api/admin/qr/create',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',cache:'no-store',credentials:'same-origin'});
   if(!response.ok)throw Error(response.status===429?'Слишком много запросов. Попробуйте позже.':'Не удалось создать запрос входа.');
   const value=await response.json() as QrRequest;
   if(!/^[a-f0-9]{64}$/.test(value.requestToken)||!/^[a-f0-9]{64}$/.test(value.desktopSecret)||!Number.isFinite(value.expiresAt)||value.expiresAt*1000<=Date.now()||!isTrustedApprovalUrl(value.approvalUrl,value.requestToken))throw Error('Некорректный ответ сервера.');
   setRequest(value);
  }catch(e){setError(e instanceof Error?e.message:'Ошибка соединения');}
  finally{setBusy(false);}
 }
 useEffect(()=>{
  if(!request)return;
  let active=true,working=false,finished=false,terminal=false;
  // The server uses epoch seconds. Never poll or consume after expiry.
  const expiresAtMs=request.expiresAt*1000;
  const poll=async()=>{
   if(!active||working||finished||terminal)return;
   if(Date.now()>=expiresAtMs){terminal=true;setStatus('expired');return;}
   working=true;
   try{
    const response=await fetch('/api/admin/qr/status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestToken:request.requestToken,desktopSecret:request.desktopSecret}),cache:'no-store',credentials:'same-origin'});
    if(!response.ok)throw Error('Не удалось проверить подтверждение.');
    const result=await response.json() as {status:Status};
    if(!active)return;
    setStatus(result.status);
    if(['rejected','expired','consumed'].includes(result.status)){terminal=true;return;}
    if(result.status!=='pending'&&result.status!=='approved')throw Error('Неизвестное состояние QR-запроса.');
    if(result.status==='approved'){
     finished=true;
     const consumed=await fetch('/api/admin/qr/consume',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestToken:request.requestToken,desktopSecret:request.desktopSecret}),cache:'no-store',credentials:'same-origin'});
     if(!consumed.ok)throw Error('Подтверждение получено, но завершить вход не удалось.');
     if(active){active=false;onAuthenticatedRef.current();}
    }
   }catch(e){if(active){setError(e instanceof Error?e.message:'Ошибка соединения');if(finished){terminal=true;setStatus('error');}}}
   finally{working=false;}
  };
  void poll();
  const timer=setInterval(()=>{void poll();},2500);
  return()=>{active=false;clearInterval(timer);};
 },[request]);
 return <div className="skp-admin-qr-login">
  <h3>Вход с iPhone</h3>
  <p>Подтвердите вход с помощью зарегистрированного Passkey. Пароль по-прежнему доступен.</p>
  {!request?<button type="button" className="button outline" disabled={busy} onClick={()=>void start()}>{busy?'Создаём запрос…':'Войти через iPhone'}</button>:<>
   <p role="status">{status==='pending'?'Ожидание подтверждения на iPhone':status==='approved'?'Завершаем вход…':status==='rejected'?'Запрос отклонён':status==='expired'?'Время запроса истекло':status==='consumed'?'Запрос уже использован':'Статус: '+status}</p>
   {canApprove&&<a href={request.approvalUrl} target="_blank" rel="noopener noreferrer">Открыть страницу подтверждения на iPhone</a>}
   {canApprove&&<button type="button" className="button outline" onClick={()=>{if(request.expiresAt*1000<=Date.now()){setStatus('expired');return;}void navigator.clipboard.writeText(request.approvalUrl).catch(()=>setError('Не удалось скопировать ссылку. Откройте её вручную.'));}}>Скопировать ссылку для iPhone</button>}
   {canApprove&&<p><small>Скопируйте ссылку и откройте её в Safari на iPhone. QR-код пока не реализован.</small></p>}
   <button type="button" className="button outline" onClick={()=>void start()}>Создать новый запрос</button>
  </>}
  {error&&<p role="alert">{error}</p>}
 </div>;
}
