'use client';
import {useState} from 'react';
import {useSearchParams} from 'next/navigation';

type Options={challenge:string;rpID:string;expiresAt:number;userVerification:string};
const fromHex=(value:string)=>Uint8Array.from(value.match(/.{2}/g)??[],v=>parseInt(v,16));
const toBase64url=(buffer:ArrayBuffer)=>btoa(String.fromCharCode(...new Uint8Array(buffer))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
export default function InvitePage(){
 const params=useSearchParams();
 const [label,setLabel]=useState('');
 const [busy,setBusy]=useState(false);
 const [done,setDone]=useState(false);
 const [message,setMessage]=useState('');
 async function enroll(){
  if(busy||done)return;
  const inviteToken=params.get('token')||'';
  if(!/^[a-f0-9]{64}$/.test(inviteToken)){setMessage('Ссылка-приглашение недействительна.');return}
  if(!window.isSecureContext||typeof PublicKeyCredential==='undefined'||!navigator.credentials?.create){
   setMessage('Для регистрации нужен HTTPS и браузер с поддержкой Passkey.');return;
  }
  setBusy(true);setMessage('');
  try{
   const optionsResponse=await fetch('/api/admin/invite/options',{
    method:'POST',headers:{'Content-Type':'application/json'},
    credentials:'same-origin',cache:'no-store',body:JSON.stringify({inviteToken}),
   });
   if(!optionsResponse.ok)throw new Error('Приглашение истекло, отозвано или недоступно.');
   const options=await optionsResponse.json() as Options;
   if(options.rpID!==location.hostname||!/^[a-f0-9]{64}$/.test(options.challenge)||
    options.userVerification!=='required'||options.expiresAt*1000<=Date.now())
    throw new Error('Недоверенный ответ сервера.');
   const credential=await navigator.credentials.create({publicKey:{
    challenge:fromHex(options.challenge),
    rp:{id:options.rpID,name:'SKP Admin Key'},
    user:{id:fromHex(options.challenge),name:'SKP Employee',displayName:'SKP Employee'},
    pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],
    authenticatorSelection:{residentKey:'required',requireResidentKey:true,userVerification:'required'},
    attestation:'none',timeout:60000,
   }}) as PublicKeyCredential|null;
   if(!credential||credential.type!=='public-key')throw new Error('Создание Passkey отменено.');
   const response=credential.response as AuthenticatorAttestationResponse;
   const registration={
    id:credential.id,rawId:toBase64url(credential.rawId),type:'public-key',
    response:{clientDataJSON:toBase64url(response.clientDataJSON),
     attestationObject:toBase64url(response.attestationObject),
     transports:typeof response.getTransports==='function'?response.getTransports():[]},
    clientExtensionResults:credential.getClientExtensionResults(),
   };
   const saved=await fetch('/api/admin/invite/complete',{
    method:'POST',headers:{'Content-Type':'application/json'},
    credentials:'same-origin',cache:'no-store',
    body:JSON.stringify({inviteToken,challenge:options.challenge,response:registration,deviceLabel:label.trim().slice(0,100)}),
   });
   const result=await saved.json() as {registered?:boolean};
   if(!saved.ok||!result.registered)throw new Error('Не удалось привязать Passkey. Обратитесь к владельцу.');
   history.replaceState(null,'','/admin/invite');
   setDone(true);setMessage('Passkey зарегистрирован. Теперь вы сможете подтверждать QR-вход.');
  }catch(e){setMessage(e instanceof Error?e.message:'Ошибка регистрации')}
  finally{setBusy(false)}
 }
 return <main style={{minHeight:'100dvh',background:'#080808',color:'#fff',display:'grid',placeItems:'center',padding:24}}>
  <section style={{width:'100%',maxWidth:430,display:'grid',gap:18}}>
   <div style={{color:'#ffd22e',fontWeight:800,letterSpacing:3}}>SKP ADMIN KEY</div>
   <h1 style={{fontSize:30,margin:0}}>Подключение устройства</h1>
   <p style={{color:'#aaa',lineHeight:1.6}}>Владелец SKP пригласил вас зарегистрировать персональный Passkey. Подтвердите действие через Face ID, Touch ID или защиту вашего устройства.</p>
   <label style={{display:'grid',gap:8}}>Название устройства
    <input maxLength={100} value={label} onChange={e=>setLabel(e.target.value)} placeholder="Мой iPhone"
     style={{padding:14,borderRadius:10,background:'#1c1c1c',border:'1px solid #555',color:'#fff'}}/>
   </label>
   <button type="button" disabled={busy||done} onClick={()=>void enroll()}
    style={{background:'#ffd22e',color:'#111',padding:16,border:0,borderRadius:10,fontWeight:700,opacity:(busy||done)?0.6:1}}>
    {done?'Устройство подключено':busy?'Подтверждаем…':'Создать Passkey'}
   </button>
   <p role="status" aria-live="polite">{message}</p>
  </section>
 </main>;
}
