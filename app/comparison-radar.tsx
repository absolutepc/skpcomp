import type {Product} from '../lib/seed';
import {comparisonMetrics,relativeValues} from '../lib/comparison-metrics';

const point=(index:number,value:number)=>{const angle=(index*60-90)*Math.PI/180;return [230+Math.cos(angle)*114*value,205+Math.sin(angle)*114*value]};
const labels=[[230,42],[368,115],[368,283],[230,362],[92,283],[92,115]];
export default function ComparisonRadar({left,right,category}:{left:Product;right?:Product;category:string}){
 const axes=comparisonMetrics(category).map(m=>{const a=m.read(left),b=right?m.read(right):null;return {...m,values:[a,b],ratios:relativeValues(a,b,m.lowerBetter)}});
 const format=(n:number|null,unit:string)=>n===null?'—':n.toLocaleString('ru-RU',{maximumFractionDigits:2})+(unit?' '+unit:'');
 return <figure className="skp-cmp-radar">
  <svg viewBox="0 0 460 420" role="img" aria-label="Шесть параметров сравнения: жёлтый — левый товар, бирюзовый — правый">
   <title>{'Характеристики '+left.name+(right?' и '+right.name:'')}</title>
   <desc>{axes.map(a=>a.label+': '+format(a.values[0],a.unit)+' / '+format(a.values[1],a.unit)).join('; ')}</desc>
   {[.2,.4,.6,.8,1].map(r=><polygon key={r} points={axes.map((_,i)=>point(i,r).join(',')).join(' ')} className="skp-radar-grid"/>)}
   {axes.map((a,i)=><line key={a.key} x1="230" y1="205" x2={point(i,1)[0]} y2={point(i,1)[1]} className="skp-radar-grid"/>)}
   {[0,1].map(side=>{const values=axes.map(a=>a.ratios[side]);return <g key={side} className={'skp-radar-series skp-radar-series-'+side}>
    {values.every(v=>v!==null)?<polygon points={values.map((v,i)=>point(i,v!).join(',')).join(' ')}/>:values.map((v,i)=>{const next=(i+1)%6;return v!==null&&values[next]!==null?<line key={i} x1={point(i,v)[0]} y1={point(i,v)[1]} x2={point(next,values[next]!)[0]} y2={point(next,values[next]!)[1]}/>:null})}
    {values.map((v,i)=>v===null?null:<circle key={i} cx={point(i,v)[0]} cy={point(i,v)[1]} r="3"><title>{axes[i].label+': '+format(axes[i].values[side],axes[i].unit)}</title></circle>)}
   </g>})}
   {axes.map((a,i)=><g key={a.key} transform={'translate('+labels[i].join(' ')+')'} className="skp-radar-label">
    <text textAnchor="middle" y="0">{a.label}{a.lowerBetter?' ↓':''}</text>
    <text textAnchor="middle" y="19" className="skp-radar-value-left">{format(a.values[0],a.unit)}</text>
    <text textAnchor="middle" y="36" className="skp-radar-value-right">{format(a.values[1],a.unit)}</text>
   </g>)}
  </svg>
  <figcaption><span><i/>Слева</span><span><i/>Справа</span></figcaption>
  <p>Шкалы относительно двух товаров. ↓ — меньше лучше. — нет данных. Единственное известное значение на оси показано на внешнем кольце; сравнение по этой оси недоступно.{axes.some(a=>a.values[0]===null||(right&&a.values[1]===null))?' Контур неполный: заполните характеристики товара.':''}{axes.some(a=>a.key.startsWith('fps-'))?' FPS — расчёт, FHD / высокие, без RT и апскейлинга.':''}</p>
 </figure>;
}
