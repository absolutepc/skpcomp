'use client';
import {useState,type FormEvent} from 'react';
import AdminQrLogin from './admin-qr-login';
import './skp-admin-login.css';

type Props={password:string;setPassword:(value:string)=>void;onPasswordLogin:()=>Promise<void>;onAuthenticated:()=>void};
export default function SkpAdminLogin({password,setPassword,onPasswordLogin,onAuthenticated}:Props){
 const [mode,setMode]=useState<'qr'|'password'>('qr');
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
    <p>Выберите удобный способ авторизации в админ-панель</p>
   </header>
   <div className="skp-auth-tabs" role="tablist" aria-label="Способ входа">
    <button type="button" role="tab" aria-selected={mode==='qr'} className={mode==='qr'?'active':''} onClick={()=>setMode('qr')}><span aria-hidden="true">▦</span> Войти по QR-коду</button>
    <button type="button" role="tab" aria-selected={mode==='password'} className={mode==='password'?'active':''} onClick={()=>setMode('password')}><span aria-hidden="true">♙</span> Вход по паролю</button>
   </div>
   {mode==='qr'?<div className="skp-auth-qr-layout" role="tabpanel">
    <div className="skp-auth-qr-frame"><AdminQrLogin onAuthenticated={onAuthenticated} autoStart/></div>
    <div className="skp-auth-info">
     <h2>Быстрый и безопасный вход</h2>
     <p>Отсканируйте QR-код устройством с зарегистрированным Passkey и подтвердите вход.</p>
     <div className="skp-auth-methods"><span>◎<small>Face ID</small></span><span>◉<small>Отпечаток</small></span><span>▣<small>Android</small></span><span>⚿<small>Ключ</small></span></div>
    </div>
   </div>:<form className="skp-auth-password" role="tabpanel" onSubmit={e=>void submit(e)}>
    <label htmlFor="skp-owner-password">Пароль владельца</label>
    <input id="skp-owner-password" type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Введите пароль"/>
    <button type="submit" disabled={submitting}>{submitting?'Проверяем…':'Войти в админ-панель'} <span aria-hidden="true">→</span></button>
   </form>}
   <footer className="skp-auth-footer"><span aria-hidden="true">⬡</span> Защищено Passkey (WebAuthn)</footer>
  </section>
 </div>;
}
