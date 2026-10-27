'use client';
import {useEffect,useState} from 'react';
import {Star} from 'lucide-react';
type Summary={count:number;average:number|null};
function reviewWord(count:number){const last=count%10,lastTwo=count%100;return last===1&&lastTwo!==11?'отзыв':last>=2&&last<=4&&(lastTwo<12||lastTwo>14)?'отзыва':'отзывов'}
export default function ProductRatingSummary({productId,onOpen,compact=false}:{productId:string;onOpen:()=>void;compact?:boolean}){
 const [summary,setSummary]=useState<Summary|null>(null);
 const [failed,setFailed]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();setSummary(null);setFailed(false);
  fetch('/api/reviews?productId='+encodeURIComponent(productId)+'&summary=1',{signal:controller.signal,cache:'no-store'})
   .then(async response=>{if(!response.ok)throw Error();return response.json() as Promise<Summary>})
   .then(value=>{if(!controller.signal.aborted)setSummary(value)})
   .catch(()=>{if(!controller.signal.aborted)setFailed(true)});
  return()=>controller.abort();
 },[productId]);
 const average=summary?.average??0;
 const text=compact?(summary?.count?average.toFixed(1).replace('.',',')+' ('+summary.count+')':failed?'—':summary?'Нет отзывов':'…'):failed?'Отзывы недоступны':!summary?'Загрузка отзывов…':summary.count?average.toFixed(1).replace('.',',')+' ('+summary.count+' '+reviewWord(summary.count)+')':'Нет отзывов';
 return <button type="button" className="skp-pdp-rating" onClick={onOpen} aria-label={compact?'Отзывы о товаре: '+text+'. Открыть товар':summary?.count?'Оценка '+average.toFixed(1)+' из 5, '+summary.count+' '+reviewWord(summary.count)+'. Открыть отзывы':text+'. Открыть отзывы'}>
  <span className="skp-pdp-stars" aria-hidden="true">{[0,1,2,3,4].map(index=><span className="skp-pdp-star" key={index}><Star size={13}/><span style={{width:Math.max(0,Math.min(1,average-index))*100+'%'}}><Star size={13} fill="currentColor"/></span></span>)}</span>
  <span>{text}</span>
 </button>;
}
