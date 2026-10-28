'use client';
import {useEffect,useState} from 'react';
import {ArrowDown,ArrowUp,Check,Gamepad2,Image as ImageIcon,RotateCcw,Save,ShieldAlert} from 'lucide-react';
import type {FpsGameAppearance} from '../lib/fps-game-catalog';
import {defaultFpsGames,getConfiguredFpsGames,validateFpsGames} from '../lib/fps-game-catalog';
import {gameProfiles} from '../lib/fps-estimate';
import './admin-fps-games.css';

function GamePreview({image,name}:{image:string;name:string}){
 const [broken,setBroken]=useState(false);
 useEffect(()=>setBroken(false),[image]);
 return <span className="skp-admin-fps-image">
  {image&&!broken?<img src={image} alt="" loading="lazy" onError={()=>setBroken(true)}/>:<ImageIcon size={25}/>}
 </span>;
}

export default function AdminFpsGames({games,onSave}:{games?:FpsGameAppearance[];onSave:(next:FpsGameAppearance[])=>Promise<boolean>}){
 const [entries,setEntries]=useState(()=>getConfiguredFpsGames(games));
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 useEffect(()=>{setEntries(getConfiguredFpsGames(games))},[games]);
 const change=(id:string,patch:Partial<FpsGameAppearance>)=>{
  setEntries(previous=>previous.map(item=>item.id===id?{...item,...patch}:item));setError('');
 };
 const move=(index:number,direction:-1|1)=>{
  const nextIndex=index+direction;
  if(nextIndex<0||nextIndex>=entries.length)return;
  const next=[...entries];
  [next[index],next[nextIndex]]=[next[nextIndex],next[index]];
  setEntries(next);
 };
 const submit=async(event:React.FormEvent)=>{
  event.preventDefault();
  const normalized=entries.map(item=>({...item,name:item.name.trim(),image:item.image.trim()}));
  if(!validateFpsGames(normalized)){setError('Проверьте названия игр и адреса изображений. Ссылки должны начинаться с https:// или /images/.');return}
  if(!normalized.some(item=>item.enabled)){setError('Оставьте хотя бы одну игру активной.');return}
  setBusy(true);setError('');
  try{const saved=await onSave(normalized);if(!saved)setError('Не удалось сохранить список игр.')}finally{setBusy(false)}
 };
 return <section className="skp-admin-fps-games">
  <div className="skp-admin-fps-header"><div><span className="skp-admin-fps-kicker">SKP / FPS</span><h1>Игры FPS-калькулятора</h1>
   <p>Управление порядком, отображением, названием и изображением игр для ПК и ноутбуков. Все изменения появятся после сохранения.</p>
  </div><Gamepad2 size={30}/></div>
  <div className="skp-admin-fps-notice"><ShieldAlert size={20}/><p>Для каждой игры уже задан расчётный профиль FPS. Скрытие, перемещение и замена картинки не меняют производительность. Для добавления новой игры сначала потребуется внести её расчётный профиль — нельзя просто указать картинку и получить достоверную оценку.</p></div>
  <form onSubmit={submit}>
   <div className="skp-admin-fps-games-list">
    {entries.map((game,index)=>{
     const profile=gameProfiles.find(p=>p.id===game.id);
     return <article className={'skp-admin-fps-game'+(!game.enabled?' is-hidden':'')} key={game.id}>
      <GamePreview image={game.image} name={game.name}/>
      <div className="skp-admin-fps-game-fields">
       <div className="skp-admin-fps-game-top">
        <span className="skp-admin-fps-game-id">{profile?.id||game.id}</span>
        <label className="skp-admin-fps-visible"><input type="checkbox" checked={game.enabled} onChange={e=>change(game.id,{enabled:e.target.checked})}/><span>{game.enabled?'Показывать':'Скрыта'}</span></label>
       </div>
       <label>Название игры<input type="text" maxLength={80} required value={game.name} onChange={e=>change(game.id,{name:e.target.value})}/></label>
       <label>Фото или логотип (URL)<input type="text" placeholder="https://... или /images/..." value={game.image} onChange={e=>change(game.id,{image:e.target.value})}/></label>
      </div>
      <div className="skp-admin-fps-game-order">
       <button type="button" disabled={index===0} onClick={()=>move(index,-1)} title="Переместить выше" aria-label={'Переместить '+game.name+' выше'}><ArrowUp size={19}/></button>
       <span>{index+1}</span>
       <button type="button" disabled={index===entries.length-1} onClick={()=>move(index,1)} title="Переместить ниже" aria-label={'Переместить '+game.name+' ниже'}><ArrowDown size={19}/></button>
      </div>
     </article>
    })}
   </div>
   {error&&<p role="alert" className="skp-admin-fps-error">{error}</p>}
   <div className="skp-admin-fps-buttons">
    <button className="skp-admin-fps-save" type="submit" disabled={busy}><Save size={18}/>{busy?'Сохранение...':'Сохранить список игр'}</button>
    <button className="skp-admin-fps-reset" type="button" disabled={busy} onClick={()=>{setEntries(defaultFpsGames.map(x=>({...x})));setError('')}}><RotateCcw size={17}/>Вернуть стандартный список</button>
   </div>
  </form>
 </section>;
}
