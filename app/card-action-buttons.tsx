'use client';
import {GitCompareArrows,Heart} from 'lucide-react';
import './card-action-buttons.css';

type Props={
 action:"favorite"|"compare";
 name:string;
 favorite:boolean;
 compared:boolean;
 onFavorite:()=>void;
 onCompare:()=>void;
};

/** Shared favorite overlay and inline comparison control. */
export default function CardActionButtons({action,name,favorite,compared,onFavorite,onCompare}:Props){
 return <div className={"skp-card-actions"+(action==='compare'?' skp-card-actions-inline':'')} role="group" aria-label={'Действия с товаром: '+name}>
  {action==='favorite'&&<button type="button" className={'skp-card-action'+(favorite?' is-active':'')}
   aria-label={(favorite?'Убрать из избранного: ':'Добавить в избранное: ')+name}
   aria-pressed={favorite} title={favorite?'Убрать из избранного':'В избранное'}
   onClick={onFavorite}>
   <Heart size={18} fill={favorite?'currentColor':'none'} aria-hidden="true"/>
  </button>}
  {action==='compare'&&<button type="button" className={'skp-card-action'+(compared?' is-active':'')}
   aria-label={(compared?'Убрать из сравнения: ':'Добавить в сравнение: ')+name}
   aria-pressed={compared} title={compared?'Убрать из сравнения':'Сравнить'}
   onClick={onCompare}>
   <GitCompareArrows size={18} aria-hidden="true"/>
  </button>}
 </div>;
}
