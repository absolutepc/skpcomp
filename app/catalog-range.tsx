'use client';
import type {CSSProperties} from 'react';

type RangeValue={min?:string;max?:string};
export default function CatalogRange({label,values,value,onChange,showLimits=false}:{showLimits?:boolean;label:string;values:number[];value:RangeValue;onChange:(value:RangeValue)=>void}){
 const valid=values.filter(Number.isFinite);
 const min=valid.length?Math.min(...valid):0;
 const max=valid.length?Math.max(...valid):0;
 const clamp=(n:number)=>Math.min(max,Math.max(min,n));
 const low=value.min!==undefined&&value.min!==''?clamp(Number(value.min)):min;
 const high=value.max!==undefined&&value.max!==''?clamp(Number(value.max)):max;
 const disabled=!valid.length||min===max;
 const percent=(n:number)=>max===min?0:(n-min)/(max-min)*100;
 const step=valid.some(n=>!Number.isInteger(n))?0.01:1;
 return <div className="skp-range-filter">
  {valid.length>0?<><div className={'skp-range-track'+(disabled?' is-disabled':'')} style={{'--range-start':percent(Math.min(low,high))+'%','--range-end':percent(Math.max(low,high))+'%'} as CSSProperties}>
   <div className="skp-range-rail"/><div className="skp-range-fill"/>
   <input type="range" min={min} max={max} step={step} value={low} disabled={disabled} aria-label={label+' — минимум'}
    style={{zIndex:low>=max?4:2}} onChange={e=>{const n=Math.min(Number(e.target.value),high);onChange({...value,min:n===min?'':String(n)})}}/>
   <input type="range" min={min} max={max} step={step} value={high} disabled={disabled} aria-label={label+' — максимум'}
    onChange={e=>{const n=Math.max(Number(e.target.value),low);onChange({...value,max:n===max?'':String(n)})}}/>
  </div>{showLimits&&<div className="skp-range-limits"><span>{min.toLocaleString('ru')}</span><span>{max.toLocaleString('ru')}</span></div>}</>:<small className="facet-no-data">Нет заполненных значений</small>}
  <div className="facet-range skp-range-inputs">
   <label><span>От</span><input type="number" step="any" min="0" aria-label={label+' от'} placeholder={valid.length?String(min):'От'} value={value.min||''} onChange={e=>onChange({...value,min:e.target.value})}/></label>
   <label><span>До</span><input type="number" step="any" min="0" aria-label={label+' до'} placeholder={valid.length?String(max):'До'} value={value.max||''} onChange={e=>onChange({...value,max:e.target.value})}/></label>
  </div>
  {value.min&&value.max&&Number(value.min)>Number(value.max)&&<small className="installment-error">Значение «от» больше значения «до»</small>}
 </div>;
}
