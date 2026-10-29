'use client';
import {useEffect,useState} from 'react';
import {ArrowDown,ArrowUp,Gamepad2,Image as ImageIcon,LoaderCircle,RotateCcw,Save,ShieldAlert,Upload} from 'lucide-react';
import type {FpsGameAppearance} from '../lib/fps-game-catalog';
import {defaultFpsGames,getConfiguredFpsGames,validFpsGameImage,validateFpsGames} from '../lib/fps-game-catalog';
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
 const [uploadingId,setUploadingId]=useState<string|null>(null);
 const [uploadNotice,setUploadNotice]=useState('');
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
 const upload=async(id:string,file:File)=>{
  if(busy||uploadingId)return;
  setError('');setUploadNotice('');
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size<50||file.size>8*1024*1024){
   setError('Выберите PNG, JPEG или WebP размером до 8 МБ.');return;
  }
  setUploadingId(id);
  try{
   const form=new FormData();
   form.append('assetType','fps-game');form.append('gameId',id);
   form.append('file',file,'fps-game.'+(file.type==='image/jpeg'?'jpg':file.type==='image/png'?'png':'webp'));
   const response=await fetch('/api/media',{method:'POST',body:form});
   const result=await response.json() as {url?:string;error?:string};
   if(!response.ok||!result.url||!validFpsGameImage(result.url))
    throw Error(result.error||'Сервер не сохранил изображение.');
   change(id,{image:result.url});
   setUploadNotice('Изображение загружено. Нажмите «Сохранить список игр», чтобы применить его.');
  }catch(e){setError(e instanceof Error?e.message:'Ошибка загрузки изображения.');}
  finally{setUploadingId(null)}
 };
 const submit=async(event:React.FormEvent)=>{
  if(uploadingId!==null||busy){event.preventDefault();return;}
  event.preventDefault();
  const normalized=entries.map(item=>({...item,name:item.name.trim(),image:item.image.trim()}));
  if(!validateFpsGames(normalized)){setError('Проверьте названия игр и адреса изображений. Можно использовать HTTPS-ссылку или загруженный файл.');return}
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
       <label className="skp-admin-fps-upload">
        {uploadingId===game.id?<LoaderCircle size={17} className="skp-admin-fps-spin"/>:<Upload size={17}/>}
        {uploadingId===game.id?'Загрузка…':'Загрузить изображение'}
        <input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy||uploadingId!==null}
         aria-label={'Загрузить изображение для '+game.name}
         onChange={e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';if(file)void upload(game.id,file)}}/>
       </label>
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
   {uploadNotice&&<p role="status" className="skp-admin-fps-success">{uploadNotice}</p>}
   <div className="skp-admin-fps-buttons">
    <button className="skp-admin-fps-save" type="submit" disabled={busy||uploadingId!==null}><Save size={18}/>{busy?'Сохранение...':'Сохранить список игр'}</button>
    <button className="skp-admin-fps-reset" type="button" disabled={busy||uploadingId!==null} onClick={()=>{setEntries(defaultFpsGames.map(x=>({...x})));setError('')}}><RotateCcw size={17}/>Вернуть стандартный список</button>
   </div>
  </form>
 </section>;
}
