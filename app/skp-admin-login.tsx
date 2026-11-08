'use client';
import {useState,type FormEvent} from 'react';
import {ScanFace,Fingerprint,KeyRound,ShieldCheck,LockKeyhole,ArrowRight,Smartphone} from 'lucide-react';
import AdminQrLogin from './admin-qr-login';
import './skp-admin-login.css';

type Props={password:string;setPassword:(value:string)=>void;onPasswordLogin:()=>Promise<void>;onAuthenticated:()=>void};
export default function SkpAdminLogin({password,setPassword,onPasswordLogin,onAuthenticated}:Props){
 const [submitting,setSubmitting]=useState(false);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(submitting)return;
  setSubmitting(true);try{await onPasswordLogin();}finally{setSubmitting(false);}
 }
 return <div className="skp-auth-stage">
  <div className="skp-auth-art skp-auth-art-left" aria-hidden="true">SKP</div>
  <div className="skp-auth-art skp-auth-art-right" aria-hidden="true"/>
  <section className="skp-auth-panel" aria-label="Авторизация владельца SKP">
   <header className="skp-auth-header">
    <div className="skp-auth-brand" aria-label="SKP">SKP<span>/</span></div>
    <div className="skp-auth-tagline">КОМПЬЮТЕРЫ · КОМПЛЕКТУЮЩИЕ · ПЕРИФЕРИЯ</div>
    <h1>Вход для владельца</h1>
    <p>Выберите пароль или подтвердите вход по QR-коду</p>
   </header>
   <div className="skp-auth-unified">
    <form className="skp-auth-password skp-auth-password-inline" onSubmit={e=>void submit(e)}>
     <div className="skp-auth-section-icon"><LockKeyhole size={19}/></div>
     <h2>Вход по паролю</h2>
     <p>Используйте пароль владельца для доступа к панели управления.</p>
     <label htmlFor="skp-owner-password">Пароль</label>
     <input id="skp-owner-password" type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Введите пароль"/>
     <button type="submit" disabled={submitting}>{submitting?'Проверяем…':'Войти'} <ArrowRight size={17}/></button>
    </form>
    <div className="skp-auth-qr-frame">
     <h2>Войти по QR-коду</h2>
     <AdminQrLogin onAuthenticated={onAuthenticated} autoStart/>
    </div>
    <div className="skp-auth-info">
     <h2>Быстрый и безопасный вход</h2>
     <p>Отсканируйте QR-код устройством с зарегистрированным Passkey и подтвердите вход.</p>
     <div className="skp-auth-methods">
      <span><ScanFace aria-hidden="true" size={25}/><small>Face ID</small></span>
      <span><Fingerprint aria-hidden="true" size={25}/><small>Отпечаток</small></span>
      <span><Smartphone aria-hidden="true" size={25}/><small>Android</small></span>
      <span><KeyRound aria-hidden="true" size={25}/><small>Ключ</small></span>
     </div>
    </div>
   </div>
   <footer className="skp-auth-footer"><ShieldCheck size={15} aria-hidden="true"/> Защищено Passkey (WebAuthn)</footer>
  </section>
 </div>;
}
