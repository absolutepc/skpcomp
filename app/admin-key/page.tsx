'use client';
import {useEffect,useRef,useState} from 'react';

type DetectedBarcode={rawValue:string};
type Detector={detect:(source:HTMLVideoElement)=>Promise<DetectedBarcode[]>};
type DetectorCtor=new(options:{formats:string[]})=>Detector;
declare global {interface Window {BarcodeDetector?:DetectorCtor}}

function trustedQrDestination(value:string):string|null{
 try{
  const url=new URL(value);
  if(url.origin!==window.location.origin||url.pathname!=='/admin/qr/approve'||
   url.searchParams.size!==1||url.searchParams.getAll('request').length!==1||
   !/^[a-f0-9]{64}$/.test(url.searchParams.get('request')||'')||
   url.hash||url.username||url.password)return null;
  // Open the same request in the installed PWA, without broadening accepted QR origins.
  return '/admin-key/approve'+url.search;
 }catch{return null}
}

export default function AdminKeyScanner(){
 const video=useRef<HTMLVideoElement|null>(null);
 const stream=useRef<MediaStream|null>(null);
 const frame=useRef<number|null>(null);
 const active=useRef(false);
 const generation=useRef(0);
 const [scanning,setScanning]=useState(false);
 const [message,setMessage]=useState('');
 const [manual,setManual]=useState('');
 const stop=()=>{
  generation.current++;
  active.current=false;
  if(frame.current!==null){cancelAnimationFrame(frame.current);frame.current=null}
  stream.current?.getTracks().forEach(track=>track.stop());
  stream.current=null;
  if(video.current)video.current.srcObject=null;
  setScanning(false);
 };
 useEffect(()=>{
  const manifest=document.createElement('link');
  manifest.rel='manifest';manifest.href='/admin-key.webmanifest';
  document.head.appendChild(manifest);
  const theme=document.createElement('meta');theme.name='theme-color';theme.content='#080808';
  document.head.appendChild(theme);
  if('serviceWorker' in navigator&&window.isSecureContext){
   void navigator.serviceWorker.register('/admin-key-sw.js',{scope:'/admin-key/'}).catch(()=>{});
  }
  const onHidden=()=>{if(document.visibilityState==='hidden'){
   generation.current++;
   active.current=false;
   if(frame.current!==null)cancelAnimationFrame(frame.current);
   stream.current?.getTracks().forEach(track=>track.stop());
   stream.current=null;
   if(video.current)video.current.srcObject=null;
   setScanning(false);
  }};
  document.addEventListener('visibilitychange',onHidden);
  return()=>{document.removeEventListener('visibilitychange',onHidden);generation.current++;active.current=false;stream.current?.getTracks().forEach(track=>track.stop());if(frame.current!==null)cancelAnimationFrame(frame.current);manifest.remove();theme.remove()};
 },[]);
 const navigate=(raw:string)=>{
  const destination=trustedQrDestination(raw.trim());
  if(!destination){setMessage('QR-код не принадлежит системе входа SKP.');return false}
  stop();window.location.assign(destination);return true;
 };
 async function start(){
  if(scanning)return;
  const attempt=++generation.current;
  setMessage('');
  if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){
   setMessage('Камера доступна только через HTTPS в поддерживаемом браузере.');return;
  }
  if(!window.BarcodeDetector){
   setMessage('Встроенное распознавание QR недоступно. Откройте камеру телефона и наведите её на QR-код компьютера либо вставьте ссылку ниже.');return;
  }
  try{
   const media=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'}}});
   if(generation.current!==attempt){media.getTracks().forEach(track=>track.stop());return}
   stream.current=media;
   if(!video.current){media.getTracks().forEach(track=>track.stop());stream.current=null;return}
   video.current.srcObject=media;
   setScanning(true);
   await video.current.play();
   if(generation.current!==attempt){media.getTracks().forEach(track=>track.stop());return}
   const DetectorClass=window.BarcodeDetector;
   if(!DetectorClass){stop();setMessage('QR-сканер недоступен.');return}
   const detector=new DetectorClass({formats:['qr_code']});
   active.current=true;
   let checking=false;
   const scan=async()=>{
    if(!active.current||generation.current!==attempt||!video.current)return;
    if(!checking&&video.current.readyState>=2){
     checking=true;
     try{
      const codes=await detector.detect(video.current);
      if(generation.current!==attempt)return;
      for(const code of codes){if(navigate(code.rawValue))return}
     }catch{if(generation.current===attempt){stop();setMessage('Не удалось распознать код. Попробуйте обычную камеру телефона.')}return}
     finally{checking=false}
    }
    if(active.current&&generation.current===attempt)frame.current=requestAnimationFrame(()=>{void scan()});
   };
   void scan();
  }catch{if(generation.current===attempt){stop();setMessage('Нет доступа к камере. Проверьте разрешения браузера.')}}
 }
 return <main style={{minHeight:'100dvh',background:'#080808',color:'#fff',display:'grid',placeItems:'center',padding:22}}>
  <section style={{maxWidth:440,width:'100%',display:'grid',gap:18}}>
   <div style={{color:'#ffd22e',letterSpacing:3,fontWeight:800,fontSize:14}}>SKP ADMIN KEY</div>
   <h1 style={{fontSize:32,margin:0}}>Вход по QR-коду</h1>
   <p style={{color:'#aaa',lineHeight:1.6,margin:0}}>Откройте QR-код на компьютере и отсканируйте его. После сканирования подтвердите вход с помощью Passkey.</p>
   <div style={{aspectRatio:'1 / 1',background:'#151515',border:'1px solid #383838',borderRadius:18,overflow:'hidden',display:'grid',placeItems:'center'}}>
    <video ref={video} muted playsInline autoPlay aria-label="Камера для сканирования QR-кода" style={{width:'100%',height:'100%',objectFit:'cover',display:scanning?'block':'none'}}/>
    {!scanning&&<span style={{color:'#888'}}>Камера выключена</span>}
   </div>
   <button type="button" onClick={()=>scanning?stop():void start()} style={{padding:16,border:0,borderRadius:12,background:'#ffd22e',color:'#111',fontWeight:800}}>{scanning?'Остановить камеру':'Сканировать QR-код'}</button>
   <form onSubmit={e=>{e.preventDefault();void navigate(manual)}} style={{display:'grid',gap:10}}>
    <label htmlFor="admin-key-link" style={{color:'#aaa'}}>Или вставьте ссылку с QR-кода</label>
    <input id="admin-key-link" value={manual} onChange={e=>setManual(e.target.value)} autoComplete="off" placeholder="https://skpcomp.vercel.app/..." style={{background:'#1b1b1b',border:'1px solid #555',borderRadius:10,padding:13,color:'#fff'}}/>
    <button type="submit" disabled={!manual.trim()} style={{background:'transparent',border:'1px solid #ffd22e',borderRadius:10,padding:12,color:'#ffd22e'}}>Открыть подтверждение</button>
   </form>
   <p role="status" aria-live="polite" style={{color:'#ffb6a8',minHeight:20}}>{message}</p>
   <p style={{fontSize:13,color:'#888',lineHeight:1.6}}>Не подтверждайте вход, который вы не начинали. Приложение не отправляет изображение с камеры на сервер.</p>
  </section>
 </main>;
}
