'use client';
import {useEffect,useState} from 'react';
const encode=(b:ArrayBuffer)=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const hex=(s:string)=>Uint8Array.from(s.match(/.{2}/g)??[],v=>parseInt(v,16));
export default function OwnerQrApprove(){
 const [token,setToken]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[approved,setApproved]=useState(false);
 useEffect(()=>{setToken(new URLSearchParams(location.search).get('request')||'');},[]);
 async function approve(){
  if(busy||approved||!/^[a-f0-9]{64}$/.test(token))return;
  setBusy(true);setMessage('');
  try{
   const optionsRes=await fetch('/api/admin/owner/qr-check/options',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestToken:token})});
   if(!optionsRes.ok)throw Error('QR-код истёк или недоступен. Создайте новый на MacBook.');
   const options=await optionsRes.json() as {challenge:string;rpID:string};
   if(options.rpID!==location.hostname)throw Error('Неверный домен Passkey.');
   const credential=await navigator.credentials.get({publicKey:{challenge:hex(options.challenge),rpId:options.rpID,userVerification:'required',timeout:90000}}) as PublicKeyCredential|null;
   if(!credential)throw Error('Подтверждение не выполнено.');
   const response=credential.response as AuthenticatorAssertionResponse;
   const assertion={id:credential.id,rawId:encode(credential.rawId),type:'public-key',response:{clientDataJSON:encode(response.clientDataJSON),authenticatorData:encode(response.authenticatorData),signature:encode(response.signature),userHandle:response.userHandle?encode(response.userHandle):undefined},clientExtensionResults:credential.getClientExtensionResults()};
   const done=await fetch('/api/admin/owner/qr-check/complete',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestToken:token,challenge:options.challenge,response:assertion})});
   if(!done.ok)throw Error('Этот Passkey не прошёл проверку. Проверьте, что выбран ключ владельца.');
   setApproved(true);setMessage('Ключ подтверждён. Вернитесь к MacBook.');
  }catch(e){setMessage(e instanceof Error?e.message:'Ошибка подтверждения');}
  finally{setBusy(false);}
 }
 return <main style={{minHeight:'100dvh',background:'#08090b',color:'#f5f5f5',display:'grid',placeItems:'center',padding:24}}><section style={{maxWidth:420,textAlign:'center'}}><h1>SKP · Проверка ключа владельца</h1><p style={{color:'#aaa'}}>Подтверждайте только проверку, которую вы начали на своём MacBook.</p><button onClick={()=>void approve()} disabled={busy||approved||!/^[a-f0-9]{64}$/.test(token)} style={{background:'#e8dc54',color:'#111',border:0,borderRadius:10,padding:'14px 22px',fontWeight:700}}>{approved?'Подтверждено':busy?'Проверяем…':'Подтвердить через Face ID'}</button><p role="status">{message||(!/^[a-f0-9]{64}$/.test(token)?'Неверная QR-ссылка.':'')}</p></section></main>;
}
