'use client';
import {useState} from 'react';

type Options={challenge:string;rpID:string;expiresAt:number;userVerification:string};
const bytesFromHex=(value:string)=>Uint8Array.from(value.match(/.{2}/g)??[],v=>parseInt(v,16));
const base64url=(buffer:ArrayBuffer)=>btoa(String.fromCharCode(...new Uint8Array(buffer))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');

export default function EnrollAdminPasskey(){
 const [password,setPassword]=useState('');
 const [label,setLabel]=useState('iPhone');
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [success,setSuccess]=useState(false);
 async function enroll(){
  if(busy)return;
  if(!password){setMessage('Введите пароль администратора.');return;}
  if(!window.isSecureContext||typeof PublicKeyCredential==='undefined'||!navigator.credentials?.create){
   setMessage('Для Passkey нужен Safari или другой поддерживаемый браузер с HTTPS.');return;
  }
  setBusy(true);setMessage('');setSuccess(false);
  try{
   const issued=await fetch('/api/admin/passkey/enroll/options',{
    method:'POST',headers:{'Content-Type':'application/json'},
    credentials:'same-origin',cache:'no-store',body:JSON.stringify({password}),
   });
   // Never keep the admin password in the page after the server has checked it.
   setPassword('');
   if(!issued.ok)throw Error(issued.status===403?'Нужна активная сессия владельца SKP и подтверждение пароля. Обычный парольный вход не создаёт учётную запись владельца.':'Не удалось начать регистрацию.');
   const options=await issued.json() as Options;
   if(options.rpID!==window.location.hostname||!/^[a-f0-9]{64}$/.test(options.challenge)||
    !Number.isFinite(options.expiresAt)||options.expiresAt*1000<=Date.now()||
    options.userVerification!=='required')throw Error('Недоверенный ответ сервера.');
   const credential=await navigator.credentials.create({publicKey:{
    challenge:bytesFromHex(options.challenge),
    rp:{id:options.rpID,name:'SKP Admin'},
    user:{id:bytesFromHex(options.challenge),name:'SKP Administrator',displayName:'SKP Administrator'},
    pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],
    authenticatorSelection:{residentKey:'required',requireResidentKey:true,userVerification:'required'},
    attestation:'none',timeout:60000,
   }}) as PublicKeyCredential|null;
   if(!credential||credential.type!=='public-key')throw Error('Регистрация отменена.');
   const response=credential.response as AuthenticatorAttestationResponse;
   const registration={
    id:credential.id,rawId:base64url(credential.rawId),type:'public-key',
    response:{
     clientDataJSON:base64url(response.clientDataJSON),
     attestationObject:base64url(response.attestationObject),
     transports:typeof response.getTransports==='function'?response.getTransports():[],
    },
    clientExtensionResults:credential.getClientExtensionResults(),
   };
   const saved=await fetch('/api/admin/passkey/enroll/complete',{
    method:'POST',headers:{'Content-Type':'application/json'},
    credentials:'same-origin',cache:'no-store',
    body:JSON.stringify({challenge:options.challenge,response:registration,deviceLabel:label.trim().slice(0,100)}),
   });
   const result=await saved.json() as {registered?:boolean};
   if(!saved.ok||result.registered!==true)throw Error(saved.status===403?'Не удалось подтвердить права владельца. Нельзя регистрировать непривязанный Passkey.':'Не удалось сохранить Passkey.');
   setSuccess(true);setMessage('Passkey зарегистрирован. Теперь можно подтверждать QR-вход на iPhone.');
  }catch(e){setMessage(e instanceof Error?e.message:'Ошибка регистрации Passkey.');}
  finally{setPassword('');setBusy(false);}
 }
 return <main style={{minHeight:'100dvh',background:'#080808',color:'#fff',display:'grid',placeItems:'center',padding:24}}>
  <section style={{maxWidth:440,width:'100%',display:'grid',gap:16}}>
   <h1 style={{fontSize:28,fontWeight:700}}>SKP — регистрация Passkey</h1>
   <p style={{color:'#bbb'}}>Регистрация доступна только владельцу с подтверждённой учётной записью и действующей сессией. Обычного пароля администратора недостаточно. Если учётная запись владельца ещё не создана, сначала требуется безопасная первоначальная настройка.</p>
   <label style={{display:'grid',gap:6}}>Название устройства
    <input value={label} onChange={e=>setLabel(e.target.value)} maxLength={100} autoComplete="off" style={{padding:12,borderRadius:8,color:'#fff',background:'#202020',border:'1px solid #555'}}/>
   </label>
   <label style={{display:'grid',gap:6}}>Пароль администратора
    <input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" style={{padding:12,borderRadius:8,color:'#fff',background:'#202020',border:'1px solid #555'}}/>
   </label>
   <button type="button" disabled={busy} onClick={()=>void enroll()} style={{padding:'14px 24px',background:'#ffd22e',color:'#111',border:0,borderRadius:10,fontWeight:700,opacity:busy?.6:1}}>
    {busy?'Регистрируем…':'Создать Passkey'}
   </button>
   <p role="status" aria-live="polite" style={{color:success?'#a4e3ad':'#ddd'}}>{message}</p>
   <a href="/admin" style={{color:'#ffd22e'}}>Вернуться в админ-панель</a>
  </section>
 </main>;
}
