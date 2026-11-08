'use client';
import {useEffect,useRef,useState} from 'react';
const encode=(b:ArrayBuffer)=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const hex=(s:string)=>Uint8Array.from(s.match(/.{2}/g)??[],v=>parseInt(v,16));
export default function ApproveQr(){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[approved,setApproved]=useState(false);
 const submitting=useRef(false);
 const [token,setToken]=useState('');
 const [linkError,setLinkError]=useState('Проверяем ссылку…');
 useEffect(()=>{
  const url=new URL(window.location.href);
  const value=url.searchParams.get('request')||'';
  setToken(value);
  if(url.hash)setLinkError('В ссылке есть лишний фрагмент после #. Откройте исходную QR-ссылку.');
  else if(!url.searchParams.has('request'))setLinkError('В адресе отсутствует параметр request. Откройте полную QR-ссылку.');
  else if(url.searchParams.size!==1||url.searchParams.getAll('request').length!==1)setLinkError('Ссылка содержит лишние или повторяющиеся параметры.');
  else if(!/^[a-f0-9]{64}$/.test(value))setLinkError('Параметр request повреждён или обрезан. Скопируйте новую ссылку целиком.');
  else setLinkError('');
 },[]);
 async function approve(){
  if(submitting.current||approved)return;
  submitting.current=true;
  if(!/^[a-f0-9]{64}$/.test(token)){submitting.current=false;return setMessage('Недействительная ссылка.');}
  if(typeof PublicKeyCredential==='undefined'||!navigator.credentials){submitting.current=false;return setMessage('Passkey не поддерживается этим браузером.');}
  setBusy(true);setMessage('');
  try{
   const optionsResponse=await fetch('/api/admin/qr/options',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestToken:token}),credentials:'same-origin',cache:'no-store'});
   if(!optionsResponse.ok)throw Error(optionsResponse.status===404?'QR-код недоступен, уже использован или срок его действия истёк. Создайте новый запрос на компьютере.':optionsResponse.status===429?'Слишком много попыток. Подождите минуту перед повтором.':optionsResponse.status===410?'Срок действия QR-кода истёк. Создайте новый запрос на компьютере.':'Не удалось получить запрос подтверждения.');
   const options=await optionsResponse.json() as {challenge:string;rpID:string;expiresAt:number};
   if(!Number.isFinite(options.expiresAt)||options.expiresAt*1000<=Date.now())throw Error('Время подтверждения истекло. Создайте новый QR-запрос на компьютере.');
   if(options.rpID!==window.location.hostname)throw Error('Недоверенный домен Passkey.');
   if(!/^[a-f0-9]{64}$/.test(options.challenge))throw Error('Некорректный challenge.');
   const credential=await navigator.credentials.get({publicKey:{challenge:hex(options.challenge),rpId:options.rpID,userVerification:'required',timeout:60000}}) as PublicKeyCredential|null;
   if(!credential)throw Error('Подтверждение отменено.');
   if(credential.type!=='public-key')throw Error('Недействительный тип учётных данных.');
   const response=credential.response as AuthenticatorAssertionResponse;
   const assertion={id:credential.id,rawId:encode(credential.rawId),type:'public-key',response:{clientDataJSON:encode(response.clientDataJSON),authenticatorData:encode(response.authenticatorData),signature:encode(response.signature),userHandle:response.userHandle?encode(response.userHandle):undefined},clientExtensionResults:credential.getClientExtensionResults()};
   if(options.expiresAt*1000<=Date.now())throw Error('Время подтверждения истекло во время Face ID. Создайте новый QR-запрос на компьютере.');
   // Only submit an assertion after the user has explicitly initiated approval.
   const result=await fetch('/api/admin/qr/decision',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestToken:token,challenge:options.challenge,response:assertion,approved:true}),credentials:'same-origin',cache:'no-store'});
   if(!result.ok){
    const payload=await result.json().catch(()=>null) as {error?:string}|null;
    const detail=payload?.error;
    throw Error(result.status===403?'Passkey не прошёл серверную проверку. Проверьте, что он зарегистрирован в этой тестовой версии SKP.':result.status===404||result.status===409?'QR-код уже подтверждён, истёк или больше не действует. Создайте новый запрос на Mac.':result.status===429?'Слишком много попыток. Подождите минуту перед повтором.':result.status===410?'Срок действия QR-кода истёк. Создайте новый запрос на компьютере.':result.status===503?'Сервер временно недоступен при проверке Passkey.':result.status===400?'Сервер отклонил формат подтверждения Passkey.':'Сервер не подтвердил вход (HTTP '+result.status+(detail==='Forbidden'?', проверка адреса':'')+').');
   }
   const decision=await result.json() as {status?:string};
   if(decision.status!=='approved')throw Error('Сервер не подтвердил вход.');
   setApproved(true);
   setMessage('Вход подтверждён. Вернитесь к компьютеру.');
  }catch(e){
   if(e instanceof DOMException&&e.name==='NotAllowedError')setMessage('Подтверждение отменено или не разрешено. Попробуйте ещё раз, если QR-код действует.');
   else if(e instanceof DOMException&&e.name==='AbortError')setMessage('Подтверждение прервано. Попробуйте ещё раз, если QR-код действует.');
   else setMessage(e instanceof Error?e.message:'Ошибка подтверждения.');
  }
  finally{submitting.current=false;setBusy(false);}
 }
 return <main style={{minHeight:'100dvh',background:'#080808',color:'#fff',display:'grid',placeItems:'center',padding:24}}><section style={{maxWidth:420,width:'100%',textAlign:'center'}}>
  <h1>SKP — подтверждение входа</h1><p>Подтверждайте только тот вход, который вы начали на своём компьютере.</p>
  <button type="button" disabled={busy||approved||!!linkError||!/^[a-f0-9]{64}$/.test(token)} onClick={()=>void approve()} style={{padding:'14px 24px',background:'#ffd22e',color:'#111',border:0,borderRadius:10,fontWeight:700}}>{approved?'Вход подтверждён':busy?'Подтверждение…':'Подтвердить через Face ID / Passkey'}</button>
  <p role="status" aria-live="polite">{message||linkError}</p>
 </section></main>;
}
