import {GitCompareArrows,Heart} from 'lucide-react';
import './card-action-buttons.css';

type Props={
 name:string;
 favorite:boolean;
 compared:boolean;
 onFavorite:()=>void;
 onCompare:()=>void;
};

/** Shared overlay actions for SKP product and ready-PC cards. */
export default function CardActionButtons({name,favorite,compared,onFavorite,onCompare}:Props){
 return <div className="skp-card-actions" role="group" aria-label={'Действия с товаром: '+name}>
  <button type="button" className={'skp-card-action'+(favorite?' is-active':'')}
   aria-label={(favorite?'Убрать из избранного: ':'Добавить в избранное: ')+name}
   aria-pressed={favorite} title={favorite?'Убрать из избранного':'В избранное'}
   onClick={onFavorite}>
   <Heart size={18} fill={favorite?'currentColor':'none'} aria-hidden="true"/>
  </button>
  <button type="button" className={'skp-card-action'+(compared?' is-active':'')}
   aria-label={(compared?'Убрать из сравнения: ':'Добавить в сравнение: ')+name}
   aria-pressed={compared} title={compared?'Убрать из сравнения':'Сравнить'}
   onClick={onCompare}>
   <GitCompareArrows size={18} aria-hidden="true"/>
  </button>
 </div>;
}
