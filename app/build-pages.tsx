'use client';
import {useEffect,useRef,useState} from 'react';
import './ready-pc-mobile.css';
import {ArrowRight,ChevronRight,ChevronDown,AlertTriangle,Heart,ShoppingBag,RotateCcw,Search,SlidersHorizontal,Cpu,Gamepad2,ShieldCheck,Layers,Check,X,Box,Grid2X2,Briefcase,Radio,GraduationCap,Palette} from 'lucide-react';
import {categoryIcons} from './catalog-icons';
import type {Product,Store} from '../lib/seed';
import {getReadyBuildSummary} from '../lib/build-components';
import {GitCompareArrows} from 'lucide-react';
import {analyzeBuild,groupCandidateOptions} from '../lib/pc-builder';
import {readSharedBuild} from '../lib/saved-builds';
import {BuildDiagnostics,SavedBuildLibrary,MobileSaveBuildModal} from './configurator-tools';
const money=(n:number)=>new Intl.NumberFormat('ru-RU').format(n)+' ₽';
const steps=[['cpu','Процессор',categoryIcons.cpu],['motherboard','Материнская плата',categoryIcons.motherboard],['ram','Оперативная память',categoryIcons.ram],['gpu','Видеокарта',categoryIcons.gpu],['ssd','Накопитель (SSD)',categoryIcons.ssd],['psu','Блок питания',categoryIcons.psu],['case','Корпус',categoryIcons.case],['cooler','Система охлаждения',categoryIcons.cooler],['os','Операционная система',Grid2X2],['extras','Дополнительные опции',PlusIcon]] as const;
function PlusIcon({size=22}:{size?:number}){return <span style={{fontSize:size}}>＋</span>}
const tasks=[['all','Все сборки',Grid2X2],['gaming','Игровые ПК',Gamepad2],['work','Рабочие ПК',Briefcase],['stream','Стриминг',Radio],['design','Дизайнерские',Palette],['study','Для учёбы',GraduationCap],['compact','Компактные',Box],['premium','Премиум',ShieldCheck]] as const;
type Common={data:Store;nav:(p:string)=>void;img:(p:Product)=>React.ReactNode;add:(ids:string[])=>void;fav:(id:string)=>void;favorites:string[];notify:(s:string)=>void;compare:(p:Product)=>void;compared:string[]};
function Hero({config,nav}:{config?:boolean;nav:Common['nav']}){return <div className={'build-hero'+(!config?' skp-ready-hero':'')}><div className="build-hero-copy"><div className="build-crumb"><a href="/" onClick={e=>{e.preventDefault();nav('/')}}>Главная</a><ChevronRight size={12}/>{config?'Конфигуратор ПК':'Готовые ПК'}</div><h1>{config?<>СОБЕРИ СВОЙ<br/><em>ИДЕАЛЬНЫЙ ПК</em></>:<>ГОТОВЫЕ <em>ПК</em></>}</h1><p>{config?<>Выбирай комплектующие, контролируй совместимость<br/>и создавай компьютер под свои задачи.</>:<>Сборки для игр, работы и творчества.<br/>Выбирай конфигурацию под свои задачи и бюджет.</>}</p>{!config&&<button className="button light" onClick={()=>document.getElementById('ready-catalog')?.scrollIntoView({behavior:'smooth'})}>Подобрать ПК под задачи <ArrowRight size={17}/></button>}<div className="build-perks">{(config?['Проверка совместимости','Расчёт стоимости','Готовые сборки','Подбор компонентов']:['Готовые решения','Выбор под задачи','Состав каждой сборки','Возможность настройки']).map(t=><div key={t}><ShieldCheck size={23}/><span>{t}</span></div>)}</div></div><svg className="build-hero-art" viewBox={config?'490 68 380 256':'530 65 485 280'} role="img" aria-label="Игровой компьютер SKP"><image href={config?'/images/config-reference.png':'/images/ready-pc-reference.png'} width="1024" height="1536"/></svg></div>}
function purposes(p:Product){if((p as any).purposes)return (p as any).purposes as string[];return p.price>140000?['gaming','stream','design','premium']:['gaming','work','study']}
export function ReadyPC(props:Common){const {data,nav,img,add,fav,favorites,compare,compared}=props;const [task,setTask]=useState('all');const [filters,setFilters]=useState<Record<string,string[]>>({});const [min,setMin]=useState('');const [max,setMax]=useState('');const [sort,setSort]=useState('popular');const [mobileFiltersOpen,setMobileFiltersOpen]=useState(false);
useEffect(()=>{if(!mobileFiltersOpen)return;const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')setMobileFiltersOpen(false)};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[mobileFiltersOpen]);
const toggle=(key:string,value:string)=>setFilters({...filters,[key]:(filters[key]||[]).includes(value)?filters[key].filter(x=>x!==value):[...(filters[key]||[]),value]});
const items=data.products.filter(p=>p.category==='pc').filter(p=>{const d=(p.name+" "+p.description+" "+Object.values(p.buildComponents||{}).join(" ")+" "+(p.buildExtras||[]).map(x=>x.value).join(" ")).toLowerCase();return (task==='all'||purposes(p).includes(task))&&(!min||p.price>=+min)&&(!max||p.price<=+max)&&(!(filters.cpu||[]).length||filters.cpu.some(x=>d.includes(x.toLowerCase())))&&(!(filters.ram||[]).length||filters.ram.some(x=>d.includes(x.toLowerCase())))&&(!(filters.gpu||[]).length||filters.gpu.some(x=>x==='NVIDIA GeForce'?/rtx|gtx|geforce/.test(d):/radeon/.test(d)))&&(!(filters.ssd||[]).length||filters.ssd.some(x=>d.includes(x.toLowerCase())))&&(!(filters.color||[]).length||filters.color.includes((p as any).color||(/white/i.test(p.name)?'Белый':'Чёрный')))});
if(sort!=='popular')items.sort((a,b)=>sort==='low'?a.price-b.price:b.price-a.price);
const maxReadyPrice=Math.max(100000,Math.ceil(Math.max(0,...data.products.filter(p=>p.category==='pc').map(p=>p.price))/10000)*10000);
return <><Hero nav={nav}/><section className="build-page skp-ready-page"><div className="task-tabs skp-ready-task-tabs">{tasks.map(([id,label,Icon])=><button key={id} className={task===id?'selected':''} onClick={()=>setTask(id)}><Icon size={19}/>{label}</button>)}</div><div className="ready-layout" id="ready-catalog"><div className="skp-ready-mobile-toolbar"><button type="button" className="skp-ready-open-filters" aria-expanded={mobileFiltersOpen} aria-controls="skp-ready-filters" onClick={()=>setMobileFiltersOpen(true)}><SlidersHorizontal size={17}/> Фильтры <ChevronDown size={16}/></button><select aria-label="Сортировка готовых ПК на телефоне" value={sort} onChange={e=>setSort(e.target.value)}><option value="popular">Сначала популярные</option><option value="low">Сначала дешевле</option><option value="high">Сначала дороже</option></select></div>{mobileFiltersOpen&&<button type="button" className="skp-ready-filter-backdrop" aria-label="Закрыть фильтры" onClick={()=>setMobileFiltersOpen(false)}/>}<aside id="skp-ready-filters" className={'ready-filters skp-ready-filter-drawer'+(mobileFiltersOpen?' mobile-open':'')} aria-label="Фильтры готовых ПК"><div className="skp-ready-filter-title"><h3>Фильтры</h3><button type="button" onClick={()=>setMobileFiltersOpen(false)} aria-label="Закрыть панель фильтров"><X size={22}/></button></div><div className="filter-group"><h4>Цена</h4><div className="price-inputs"><input aria-label="Минимальная цена" type="number" min="0" placeholder="от 0" value={min} onChange={e=>setMin(e.target.value)}/><span>—</span><input aria-label="Максимальная цена" type="number" min="0" placeholder="до, ₽" value={max} onChange={e=>setMax(e.target.value)}/></div><input className="skp-ready-price-slider" type="range" aria-label="Максимальная цена, ползунок" min="0" max={maxReadyPrice} step="1000" value={max?Math.min(maxReadyPrice,Number(max)):maxReadyPrice} onChange={e=>setMax(Number(e.target.value)===maxReadyPrice?'':e.target.value)}/></div>{[['cpu','Процессор',['Intel','AMD']],['gpu','Видеокарта',['NVIDIA GeForce','AMD Radeon']],['ram','Оперативная память',['16 ГБ','32 ГБ','64 ГБ']],['ssd','Объём SSD',['512 ГБ','1 ТБ','2 ТБ']],['color','Цвет',['Чёрный','Белый']]].map(([key,title,values])=><div className="filter-group" key={key as string}><h4>{title as string}</h4>{(values as string[]).map(v=><label className={'filter-check'+(key==='color'?' skp-ready-color-choice':'')} key={v}><input type="checkbox" checked={(filters[key as string]||[]).includes(v)} onChange={()=>toggle(key as string,v)}/>{key==='color'&&<span className={'skp-ready-color-swatch '+(v==='Белый'?'white':'black')}/>} {v}</label>)}</div>)}<button className="filter-reset" onClick={()=>{setFilters({});setMin('');setMax('');setTask('all')}}><RotateCcw size={14}/> Сбросить фильтры</button><button type="button" className="skp-ready-filter-apply" onClick={()=>setMobileFiltersOpen(false)}>Показать {items.length} {items.length===1?'товар':items.length>1&&items.length<5?'товара':'товаров'}</button></aside><div><div className="ready-heading"><div><h2>Готовые ПК</h2><span>Найдено: {items.length}</span></div><select aria-label="Сортировка сборок" value={sort} onChange={e=>setSort(e.target.value)}><option value="popular">По умолчанию</option><option value="low">Сначала дешевле</option><option value="high">Сначала дороже</option></select></div><div className="ready-grid skp-ready-cards">{items.map((p,index)=><article className="build-card skp-ready-card" key={p.id}><a href={'/product/'+p.id} onClick={e=>{e.preventDefault();nav('/product/'+p.id)}} className="build-card-art">{img(p)}</a><button className={'favorite '+(favorites.includes(p.id)?'chosen':'')} aria-label="В избранное" onClick={()=>fav(p.id)}><Heart size={17} fill={favorites.includes(p.id)?'currentColor':'none'}/></button><button type="button" className={"skp-ready-card-compare"+(compared.includes(p.id)?" selected":"")} aria-label={compared.includes(p.id)?"Убрать из сравнения: "+p.name:"Добавить в сравнение: "+p.name} aria-pressed={compared.includes(p.id)} onClick={()=>compare(p)}><GitCompareArrows size={17}/></button><span className="build-badge">{p.id.startsWith('skp-demo-')?'ДЕМО · ФОТО АНАЛОГА':index===0?'SKP BUILD':purposes(p).includes('stream')?'Для стриминга':purposes(p).includes('design')?'Для дизайна':'Готовый ПК'}</span><div className="build-card-body"><a href={'/product/'+p.id} onClick={e=>{e.preventDefault();nav('/product/'+p.id)}}><h3>{p.name}</h3></a><p className="build-caption">{p.id.startsWith('skp-demo-')?'Пример сборки · фото аналогичного ПК':purposes(p).includes('premium')?'Производительность без компромиссов':'Твой компьютер для новых задач'}</p><ul>{getReadyBuildSummary(p).slice(0,4).map(row=><li key={row.key}><Cpu size={12}/><span>{row.label&&<b className="ready-build-part">{row.label}: </b>}{row.value}</span></li>)}</ul><button className={'skp-compare-inline'+(compared.includes(p.id)?' selected':'')} onClick={()=>compare(p)} type="button"><GitCompareArrows size={15}/>{compared.includes(p.id)?'В сравнении':'Сравнить ПК'}</button><div className="price-line"><strong>{money(p.price)}</strong><button onClick={()=>add([p.id])} aria-label="Добавить ПК в корзину"><ShoppingBag size={18}/></button></div></div></article>)}</div>{items.length===0&&<div className="empty"><h2>Нет подходящих сборок</h2><p>Попробуй другие параметры или собери свой компьютер.</p><button className="button light" onClick={()=>nav('/configurator')}>В конфигуратор <ArrowRight size={18}/></button></div>}<div className="ready-bottom"><div><h2>Не нашли подходящую сборку?</h2><p>Выберите комплектующие и создайте свой SKP.</p><button className="button light" onClick={()=>nav('/configurator')}>Перейти в конфигуратор <ArrowRight size={17}/></button></div><Layers size={85}/></div></div></div><div className="brands"><span>ASUS</span><span>msi</span><span>GIGABYTE</span><span>PALIT</span><span>intel</span><span>AMD</span><span>NVIDIA</span></div></section></>}
export function Configurator(props:Common&{selected:Record<string,string>;setSelected:(s:Record<string,string>)=>void;loaded?:boolean}){
const {data,nav,img,add,fav,favorites,selected,setSelected,notify,loaded=true}=props;
const [step,setStep]=useState('cpu');
const [task,setTask]=useState('gaming');
const [search,setSearch]=useState('');
const [sort,setSort]=useState('popular');
const [showSaved,setShowSaved]=useState(false);
const [mobileSaveOpen,setMobileSaveOpen]=useState(false);
const [savedRevision,setSavedRevision]=useState(0);
const [showIncompatible,setShowIncompatible]=useState(false);
const sharedLoaded=useRef(false);
useEffect(()=>{
 if(!loaded||sharedLoaded.current)return;
 sharedLoaded.current=true;
 const imported=readSharedBuild(window.location.search,data.products);
 if(imported){setSelected(imported);setShowSaved(true);notify('Конфигурация из ссылки загружена')}
},[loaded,data.products,setSelected,notify]);
const picked=Object.values(selected).map(id=>data.products.find(p=>p.id===id)).filter(Boolean) as Product[];
const get=(key:string)=>picked.find(p=>p.id===selected[key]);
const analysis=analyzeBuild(selected,data.products);
const problems=analysis.issues.filter(issue=>issue.severity==='error');
const total=picked.reduce((n,p)=>n+p.price,0);
const complete=steps.slice(0,8).every(([key])=>get(key));
let options=data.products.filter(p=>step==='extras'?p.category==='peripherals':p.category===step)
 .filter(p=>(p.name+' '+p.description).toLowerCase().includes(search.toLowerCase()));
if(sort!=='popular')options.sort((a,b)=>sort==='low'?a.price-b.price:b.price-a.price);
const {compatible,incompatible}=groupCandidateOptions(step,options,selected,data.products);
const openLibrary=()=>{setShowSaved(true);requestAnimationFrame(()=>document.getElementById('skp-saved-builds')?.scrollIntoView({behavior:'smooth',block:'start'}))};
const requestSave=()=>{
 if(typeof window!=='undefined'&&window.matchMedia('(max-width:700px)').matches){
  setMobileSaveOpen(true);
  return;
 }
 openLibrary();
};
const choose=(p:Product)=>{
 const activeStep=step;
 setSelected({...selected,[activeStep]:p.id});
 notify('Добавлено: '+p.name);
 const currentIndex=steps.findIndex(([key])=>key===activeStep);
 const next=steps.slice(currentIndex+1).find(([key])=>
  key==='extras'?data.products.some(item=>item.category==='peripherals'):
  data.products.some(item=>item.category===key)
 );
 if(!next)return;
 setStep(next[0]);
 setSearch('');
 setShowIncompatible(false);
 // On small screens, bring the next selection area into view and reveal its tab.
 if(typeof window!=='undefined'&&window.matchMedia('(max-width:700px)').matches){
  requestAnimationFrame(()=>{
   const tabs=document.querySelector('.component-steps');
   const active=tabs?.querySelector<HTMLButtonElement>('button.current');
   if(tabs instanceof HTMLElement&&active){
    tabs.scrollTo({left:active.offsetLeft-tabs.offsetLeft-(tabs.clientWidth-active.clientWidth)/2,behavior:'smooth'});
   }
   document.getElementById('skp-builder-options')?.scrollIntoView({behavior:'smooth',block:'start'});
  });
 }
};
const renderComponentOption=({product:p,issues:candidateIssues}:(typeof compatible)[number])=>{
 const conflict=candidateIssues.length>0;
 return <article className={'build-card component-card '+(selected[step]===p.id?'is-picked ':'')+(conflict?'is-incompatible':'')} key={p.id}><a href={'/product/'+p.id} onClick={e=>{e.preventDefault();nav('/product/'+p.id)}} className="build-card-art">{img(p)}</a><button className={'favorite '+(favorites.includes(p.id)?'chosen':'')} aria-label="В избранное" onClick={()=>fav(p.id)}><Heart size={16} fill={favorites.includes(p.id)?'currentColor':'none'}/></button><div className="build-card-body"><h3>{p.name}</h3><p className="component-desc">{p.description}</p>{conflict&&<p className="compat-error">{candidateIssues[0].message}</p>}<div className="price-line"><strong>{money(p.price)}</strong><button title={conflict?candidateIssues[0].message:selected[step]===p.id?'Уже в сборке':'Добавить в сборку'} aria-label={'Выбрать '+p.name} disabled={!!conflict} onClick={()=>choose(p)}>{selected[step]===p.id?<Check size={18}/>:<ShoppingBag size={18}/>}</button></div></div></article>;
};
return <><Hero config nav={nav}/><section className="build-page config-page"><div className="config-toolbar"><div className="task-tabs">{tasks.slice(1,5).map(([id,label,Icon])=><button key={id} className={task===id?'selected':''} onClick={()=>setTask(id)}><Icon size={18}/>{label.replace(' ПК','')}</button>)}</div><div className="config-actions"><button onClick={()=>setSelected({})}><RotateCcw size={15}/> Сбросить</button><button onClick={openLibrary}>Открыть сохранённую</button><button onClick={requestSave}><Heart size={15}/> Сохранить сборку</button></div></div><p className="task-hint">{({gaming:'Для игр: начни с процессора и видеокарты, затем подбери совместимую плату.',work:'Для работы: учитывай требования программ и нужный объём памяти.',stream:'Для стриминга: предусмотрите запас производительности процессора и видеокарты.',design:'Для дизайна: проверь требования рабочих программ к памяти и графике.'} as Record<string,string>)[task]}</p>{showSaved&&<SavedBuildLibrary key={savedRevision} selected={selected} products={data.products} onLoad={setSelected} notify={notify}/>}<div className="builder-layout"><aside className="component-steps">{steps.map(([key,label,Icon],i)=><button className={step===key?'current':''} key={key} onClick={()=>{setStep(key);setSearch('')}}><span className="step-num">{String(i+1).padStart(2,'0')}</span><Icon size={26}/><span><strong>{label}</strong><small>{get(key)?.name||(i>7?'Необязательно':'Выберите компонент')}</small></span>{get(key)?<Check size={16}/>:<ChevronRight size={15}/>}</button>)}</aside><div className="component-products" id="skp-builder-options"><h2>{steps.find(([key])=>key===step)?.[1]}</h2><div className="component-search"><div><Search size={15}/><input aria-label="Поиск компонентов" placeholder="Поиск компонента" value={search} onChange={e=>setSearch(e.target.value)}/></div><select aria-label="Сортировка компонентов" value={sort} onChange={e=>setSort(e.target.value)}><option value="popular">По умолчанию</option><option value="low">Дешевле</option><option value="high">Дороже</option></select></div>{incompatible.length>0&&compatible.length>0&&<div className="skp-compatible-heading"><ShieldCheck size={16}/><span>Совместимые комплектующие</span><small>{compatible.length}</small></div>}
<div className="component-grid">{compatible.map(renderComponentOption)}</div>
{compatible.length===0&&incompatible.length>0&&<div className="skp-compatible-empty"><ShieldCheck size={22}/><p>Совместимые комплектующие не найдены. Попробуйте изменить выбранные детали или посмотреть ограничения ниже.</p></div>}
{incompatible.length>0&&<div className="skp-builder-incompatible">
 <button type="button" className="skp-incompatible-toggle" aria-expanded={showIncompatible} onClick={()=>setShowIncompatible(value=>!value)}>
  <AlertTriangle size={17}/><span>{showIncompatible?'Скрыть несовместимые':'Показать несовместимые'}</span><small>{incompatible.length}</small><ChevronDown size={16} className={showIncompatible?'expanded':''}/>
 </button>
 {showIncompatible&&<><p className="skp-incompatible-description">Эти детали конфликтуют с текущей конфигурацией. Выбор заблокирован; причины указаны в карточках.</p>
  <div className="component-grid skp-incompatible-grid">{incompatible.map(renderComponentOption)}</div></>}
</div>}{!options.length&&<div className="component-empty"><Box size={35}/><h3>{search?'Ничего не найдено':'Товары пока не добавлены'}</h3><p>{step==='os'?'Операционная система не обязательна для завершения сборки.':'Выбери другой раздел или измени поиск.'}</p></div>}</div><aside className="configuration-panel"><h3>Ваша конфигурация</h3>{steps.slice(0,9).map(([key,label,Icon])=>{
 const part=get(key);
 return <div className={'configuration-row'+(part?' has-product':'')} key={key}>
  <span className={'configuration-item-art'+(part?' has-image':'')} aria-hidden="true">{part?img(part):<Icon size={23}/>}</span>
  <button type="button" onClick={()=>{setStep(key);setSearch('')}}>
   <span>{label}</span><small className={part?'filled':''}>{part?.name||'Не выбрано'}</small>
   {part&&<strong className="configuration-item-price">{part.price>0?money(part.price):'Цена по запросу'}</strong>}
  </button>
  {part&&<button type="button" className="configuration-item-remove" aria-label={'Убрать '+label} onClick={()=>{const next={...selected};delete next[key];setSelected(next)}}><X size={14}/></button>}
 </div>;
})}{get('extras')&&<div className="configuration-row has-product">
 <span className="configuration-item-art has-image" aria-hidden="true">{img(get('extras')!)}</span>
 <button type="button" onClick={()=>{setStep('extras');setSearch('')}}><span>Дополнительные опции</span><small className="filled">{get('extras')?.name}</small><strong className="configuration-item-price">{money(get('extras')!.price)}</strong></button>
 <button type="button" className="configuration-item-remove" aria-label="Убрать опцию" onClick={()=>{const n={...selected};delete n.extras;setSelected(n)}}><X size={14}/></button>
 </div>}<BuildDiagnostics analysis={analysis}/><div className="configuration-total"><strong>Итого</strong><strong>{money(total)}</strong></div><button className="button light" disabled={!complete||problems.length>0} onClick={()=>add(picked.map(p=>p.id))}><ShoppingBag size={16}/> Добавить в корзину</button><button className="button outline" onClick={requestSave}><Heart size={15}/> Сохранить конфигурацию</button><small className="config-disclaimer">Несовместимые компоненты нельзя добавить в корзину. Уточните BIOS, разъёмы и размеры перед оформлением.</small></aside></div><div className="recommend-section"><h2>Рекомендуем для сборки</h2><div className="recommended-grid">{['case','cooler','psu','ram','ssd'].map(key=>data.products.find(p=>p.category===key)).filter(Boolean).map(p=><article className="build-card" key={p!.id}><div className="build-card-art">{img(p!)}</div><div className="build-card-body"><h3>{p!.name}</h3><div className="price-line"><strong>{money(p!.price)}</strong><button aria-label={'Перейти к выбору '+p!.name} onClick={()=>{setStep(p!.category);setSearch('');document.querySelector('.builder-layout')?.scrollIntoView({behavior:'smooth'})}}><ArrowRight size={17}/></button></div></div></article>)}</div></div><div className="recommend-section"><div className="section-head"><h2>Готовые сборки</h2><button className="text-link yellow" onClick={()=>nav('/pc')}>Все сборки <ArrowRight size={16}/></button></div><div className="recommended-builds">{data.products.filter(p=>p.category==='pc').slice(0,4).map(p=><a className="recommended-build" href={'/product/'+p.id} key={p.id} onClick={e=>{e.preventDefault();nav('/product/'+p.id)}}>{img(p)}<div><h3>{p.name}</h3><strong>{money(p.price)}</strong><ArrowRight size={18}/></div></a>)}</div></div>{mobileSaveOpen&&<MobileSaveBuildModal selected={selected} products={data.products} total={total} notify={notify} onClose={()=>setMobileSaveOpen(false)} onSaved={()=>setSavedRevision(n=>n+1)}/>}</section></>}