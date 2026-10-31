'use client';
import {useEffect,useRef,useState} from 'react';
import './ready-pc-mobile.css';
import './configurator-visual.css';
import ConfiguratorCarousel from './configurator-carousel';
import {matchesComponentColor,type ComponentColor} from '../lib/component-color';
import ProductBrandLogo from './product-brand-logo';
import CardActionButtons from './card-action-buttons';
import {Plus,ArrowRight,ChevronRight,ChevronDown,AlertTriangle,Heart,ShoppingBag,RotateCcw,RefreshCw,Search,SlidersHorizontal,Cpu,Gamepad2,ShieldCheck,Layers,Check,X,Box,Grid2X2,Briefcase,Radio,GraduationCap,Palette} from 'lucide-react';
import {categoryIcons} from './catalog-icons';
import type {Product,Store} from '../lib/seed';
import {getReadyBuildSummary} from '../lib/build-components';
import {GitCompareArrows} from 'lucide-react';
import {analyzeBuild,candidateErrors,groupCandidateOptions} from '../lib/pc-builder';
import {availableGpuModels,gpuModelFamily} from '../lib/gpu-model-family';
import {BUILD_OS_OPTIONS,PC_ASSEMBLY_FEE,type CustomBuildCartItem,osName} from '../lib/custom-build-cart';
import {readSharedBuild} from '../lib/saved-builds';
import {BuildDiagnostics,SavedBuildLibrary,MobileSaveBuildModal} from './configurator-tools';
const money=(n:number)=>new Intl.NumberFormat('ru-RU').format(n)+' ₽';
const steps=[['cpu','Процессор',categoryIcons.cpu],['motherboard','Материнская плата',categoryIcons.motherboard],['ram','Оперативная память',categoryIcons.ram],['gpu','Видеокарта',categoryIcons.gpu],['ssd','Накопитель (SSD)',categoryIcons.ssd],['psu','Блок питания',categoryIcons.psu],['case','Корпус',categoryIcons.case],['cooler','Система охлаждения',categoryIcons.cooler],['os','Операционная система',Grid2X2],['extras','Дополнительные опции',PlusIcon]] as const;
function PlusIcon({size=22}:{size?:number}){return <span style={{fontSize:size}}>＋</span>}
const tasks=[['all','Все сборки',Grid2X2],['gaming','Игровые ПК',Gamepad2],['work','Рабочие ПК',Briefcase],['stream','Стриминг',Radio],['design','Дизайнерские',Palette],['study','Для учёбы',GraduationCap],['compact','Компактные',Box],['premium','Премиум',ShieldCheck]] as const;
type Common={data:Store;nav:(p:string)=>void;img:(p:Product)=>React.ReactNode;add:(ids:string[])=>void;addBuild?:(item:CustomBuildCartItem)=>void;fav:(id:string)=>void;favorites:string[];notify:(s:string)=>void;compare:(p:Product)=>void;compared:string[]};
function purposes(p:Product){if((p as any).purposes)return (p as any).purposes as string[];return p.price>140000?['gaming','stream','design','premium']:['gaming','work','study']}
export function ReadyPC(props:Common){const {data,nav,img,add,fav,favorites,compare,compared}=props;const [task,setTask]=useState('all');const [filters,setFilters]=useState<Record<string,string[]>>({});const [min,setMin]=useState('');const [max,setMax]=useState('');const [sort,setSort]=useState('popular');const [mobileFiltersOpen,setMobileFiltersOpen]=useState(false);
useEffect(()=>{if(!mobileFiltersOpen)return;const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')setMobileFiltersOpen(false)};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[mobileFiltersOpen]);
const toggle=(key:string,value:string)=>setFilters({...filters,[key]:(filters[key]||[]).includes(value)?filters[key].filter(x=>x!==value):[...(filters[key]||[]),value]});
const items=data.products.filter(p=>p.category==='pc').filter(p=>{const d=(p.name+" "+p.description+" "+Object.values(p.buildComponents||{}).join(" ")+" "+(p.buildExtras||[]).map(x=>x.value).join(" ")).toLowerCase();return (task==='all'||purposes(p).includes(task))&&(!min||p.price>=+min)&&(!max||p.price<=+max)&&(!(filters.cpu||[]).length||filters.cpu.some(x=>d.includes(x.toLowerCase())))&&(!(filters.ram||[]).length||filters.ram.some(x=>d.includes(x.toLowerCase())))&&(!(filters.gpu||[]).length||filters.gpu.some(x=>x==='NVIDIA GeForce'?/rtx|gtx|geforce/.test(d):/radeon/.test(d)))&&(!(filters.ssd||[]).length||filters.ssd.some(x=>d.includes(x.toLowerCase())))&&(!(filters.color||[]).length||filters.color.includes((p as any).color||(/white/i.test(p.name)?'Белый':'Чёрный')))});
if(sort!=='popular')items.sort((a,b)=>sort==='low'?a.price-b.price:b.price-a.price);
const maxReadyPrice=Math.max(100000,Math.ceil(Math.max(0,...data.products.filter(p=>p.category==='pc').map(p=>p.price))/10000)*10000);
return <><section className="build-page skp-ready-page" aria-label="Готовые ПК"><div className="task-tabs skp-ready-task-tabs">{tasks.map(([id,label,Icon])=><button key={id} className={task===id?'selected':''} onClick={()=>setTask(id)}><Icon size={19}/>{label}</button>)}</div><div className="ready-layout" id="ready-catalog"><div className="skp-ready-mobile-toolbar"><button type="button" className="skp-ready-open-filters" aria-expanded={mobileFiltersOpen} aria-controls="skp-ready-filters" onClick={()=>setMobileFiltersOpen(true)}><SlidersHorizontal size={17}/> Фильтры <ChevronDown size={16}/></button><select aria-label="Сортировка готовых ПК на телефоне" value={sort} onChange={e=>setSort(e.target.value)}><option value="popular">Сначала популярные</option><option value="low">Сначала дешевле</option><option value="high">Сначала дороже</option></select></div>{mobileFiltersOpen&&<button type="button" className="skp-ready-filter-backdrop" aria-label="Закрыть фильтры" onClick={()=>setMobileFiltersOpen(false)}/>}<aside id="skp-ready-filters" className={'ready-filters skp-ready-filter-drawer'+(mobileFiltersOpen?' mobile-open':'')} aria-label="Фильтры готовых ПК"><div className="skp-ready-filter-title"><h3>Фильтры</h3><button type="button" onClick={()=>setMobileFiltersOpen(false)} aria-label="Закрыть панель фильтров"><X size={22}/></button></div><div className="filter-group"><h4>Цена</h4><div className="price-inputs"><input aria-label="Минимальная цена" type="number" min="0" placeholder="от 0" value={min} onChange={e=>setMin(e.target.value)}/><span>—</span><input aria-label="Максимальная цена" type="number" min="0" placeholder="до, ₽" value={max} onChange={e=>setMax(e.target.value)}/></div><input className="skp-ready-price-slider" type="range" aria-label="Максимальная цена, ползунок" min="0" max={maxReadyPrice} step="1000" value={max?Math.min(maxReadyPrice,Number(max)):maxReadyPrice} onChange={e=>setMax(Number(e.target.value)===maxReadyPrice?'':e.target.value)}/></div>{[['cpu','Процессор',['Intel','AMD']],['gpu','Видеокарта',['NVIDIA GeForce','AMD Radeon']],['ram','Оперативная память',['16 ГБ','32 ГБ','64 ГБ']],['ssd','Объём SSD',['512 ГБ','1 ТБ','2 ТБ']],['color','Цвет',['Чёрный','Белый']]].map(([key,title,values])=><div className="filter-group" key={key as string}><h4>{title as string}</h4>{(values as string[]).map(v=><label className={'filter-check'+(key==='color'?' skp-ready-color-choice':'')} key={v}><input type="checkbox" checked={(filters[key as string]||[]).includes(v)} onChange={()=>toggle(key as string,v)}/>{key==='color'&&<span className={'skp-ready-color-swatch '+(v==='Белый'?'white':'black')}/>} {v}</label>)}</div>)}<button className="filter-reset" onClick={()=>{setFilters({});setMin('');setMax('');setTask('all')}}><RotateCcw size={14}/> Сбросить фильтры</button><button type="button" className="skp-ready-filter-apply" onClick={()=>setMobileFiltersOpen(false)}>Показать {items.length} {items.length===1?'товар':items.length>1&&items.length<5?'товара':'товаров'}</button></aside><div><div className="ready-heading"><div><h2>Готовые ПК</h2><span>Найдено: {items.length}</span></div><select aria-label="Сортировка сборок" value={sort} onChange={e=>setSort(e.target.value)}><option value="popular">По умолчанию</option><option value="low">Сначала дешевле</option><option value="high">Сначала дороже</option></select></div><div className="ready-grid skp-ready-cards">{items.map((p,index)=><article className="build-card skp-ready-card" key={p.id}><a href={'/product/'+p.id} onClick={e=>{e.preventDefault();nav('/product/'+p.id)}} className="build-card-art">{img(p)}</a><CardActionButtons action="favorite" name={p.name} favorite={favorites.includes(p.id)} compared={compared.includes(p.id)} onFavorite={()=>fav(p.id)} onCompare={()=>compare(p)}/><span className="build-badge">{p.id.startsWith('skp-demo-')?'ДЕМО · ФОТО АНАЛОГА':index===0?'SKP BUILD':purposes(p).includes('stream')?'Для стриминга':purposes(p).includes('design')?'Для дизайна':'Готовый ПК'}</span><div className="build-card-body"><a href={'/product/'+p.id} onClick={e=>{e.preventDefault();nav('/product/'+p.id)}}><h3>{p.name}</h3></a><p className="build-caption">{p.id.startsWith('skp-demo-')?'Пример сборки · фото аналогичного ПК':purposes(p).includes('premium')?'Производительность без компромиссов':'Твой компьютер для новых задач'}</p><ul>{getReadyBuildSummary(p).slice(0,4).map(row=><li key={row.key}><Cpu size={12}/><span>{row.label&&<b className="ready-build-part">{row.label}: </b>}{row.value}</span></li>)}</ul><div className="price-line"><strong>{money(p.price)}</strong><div className="skp-card-purchase-actions"><CardActionButtons action="compare" name={p.name} favorite={favorites.includes(p.id)} compared={compared.includes(p.id)} onFavorite={()=>fav(p.id)} onCompare={()=>compare(p)}/><button onClick={()=>add([p.id])} aria-label="Добавить ПК в корзину"><ShoppingBag size={18}/></button></div></div></div></article>)}</div>{items.length===0&&<div className="empty"><h2>Нет подходящих сборок</h2><p>Попробуй другие параметры или собери свой компьютер.</p><button className="button light" onClick={()=>nav('/configurator')}>В конфигуратор <ArrowRight size={18}/></button></div>}<div className="ready-bottom"><div><h2>Не нашли подходящую сборку?</h2><p>Выберите комплектующие и создайте свой SKP.</p><button className="button light" onClick={()=>nav('/configurator')}>Перейти в конфигуратор <ArrowRight size={17}/></button></div><Layers size={85}/></div></div></div><div className="brands"><span>ASUS</span><span>msi</span><span>GIGABYTE</span><span>PALIT</span><span>intel</span><span>AMD</span><span>NVIDIA</span></div></section></>}
export function Configurator(props:Common&{selected:Record<string,string>;setSelected:(s:Record<string,string>)=>void;loaded?:boolean}){
const {data,nav,img,addBuild,fav,favorites,compare,compared,selected,setSelected,notify,loaded=true}=props;
const [step,setStep]=useState('cpu');
const [cpuBrand,setCpuBrand]=useState('');
const [cpuSocket,setCpuSocket]=useState('');
const [componentColor,setComponentColor]=useState<ComponentColor>('');
const [gpuModel,setGpuModel]=useState('');
const [productView,setProductView]=useState<'carousel'|'list'>('carousel');
const [search,setSearch]=useState('');
const [filters,setComponentFilters]=useState({step:'cpu',brand:''});
const activeFilters=filters.step===step?{...filters}:{step,brand:''};
const setFilter=(key:'brand',value:string)=>{setComponentFilters({...activeFilters,[key]:value});if(step==='gpu')setGpuModel('');};
const [showSaved,setShowSaved]=useState(false);
const [mobileSaveOpen,setMobileSaveOpen]=useState(false);
const [savedRevision,setSavedRevision]=useState(0);
const [showIncompatible,setShowIncompatible]=useState(false);
const [pendingChoice,setPendingChoice]=useState<{step:string;product?:Product;osId?:string}|null>(null);
const confirmCancelRef=useRef<HTMLButtonElement>(null);
const sharedLoaded=useRef(false);
useEffect(()=>{
 if(!pendingChoice)return;
 confirmCancelRef.current?.focus();
 const dismiss=(event:KeyboardEvent)=>{if(event.key==='Escape')setPendingChoice(null)};
 window.addEventListener('keydown',dismiss);
 return()=>window.removeEventListener('keydown',dismiss);
},[pendingChoice]);
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
const total=picked.reduce((n,p)=>n+p.price,0)+(picked.length?PC_ASSEMBLY_FEE:0);
const complete=steps.slice(0,8).every(([key])=>(get(key)?.price||0)>0)&&(!selected.extras||(get('extras')?.price||0)>0);
const categoryProducts=data.products.filter(p=>step==='extras'?p.category==='peripherals':p.category===step);
const cpuBrandOf=(p:Product)=>/amd/i.test(p.brand)?'AMD':/intel/i.test(p.brand)?'Intel':'';
const cpuSocketOf=(p:Product)=>(p.specs?.socket||p.socket||'').trim();
const cpuSockets=step==='cpu'&&cpuBrand?[...new Set(categoryProducts.filter(p=>cpuBrandOf(p)===cpuBrand).map(cpuSocketOf).filter(Boolean))].sort():[];
const brands=[...new Set(categoryProducts.map(p=>p.brand).filter(Boolean))].sort();
const gpuModels=step==='gpu'?availableGpuModels(categoryProducts.filter(p=>!activeFilters.brand||p.brand===activeFilters.brand)):[];
let options=data.products.filter(p=>step==='extras'?p.category==='peripherals':p.category===step)
 .filter(p=>step==='cpu'?(!cpuBrand||cpuBrandOf(p)===cpuBrand)&&(!cpuSocket||cpuSocketOf(p)===cpuSocket):matchesComponentColor(p,componentColor))
 .filter(p=>(p.name+' '+p.description).toLowerCase().includes(search.toLowerCase()))
 .filter(p=>(!activeFilters.brand||p.brand===activeFilters.brand))
 .filter(p=>step!=='gpu'||!gpuModel||gpuModelFamily(p)===gpuModel);
options.sort((a,b)=>a.price-b.price);
const {compatible,incompatible}=groupCandidateOptions(step,options,selected,data.products);
const openLibrary=()=>{setShowSaved(true);requestAnimationFrame(()=>document.getElementById('skp-saved-builds')?.scrollIntoView({behavior:'smooth',block:'start'}))};
const requestSave=()=>{
 if(typeof window!=='undefined'&&window.matchMedia('(max-width:700px)').matches){
  setMobileSaveOpen(true);
  return;
 }
 openLibrary();
};
const choose=(p:Product)=>setPendingChoice({step,product:p});
const chooseOs=(id:string)=>setPendingChoice({step:'os',osId:id});
const confirmChoice=(advance:boolean)=>{
 if(!pendingChoice)return;
 const {step:chosenStep,product,osId}=pendingChoice;
 if(product){
  const conflicts=candidateErrors(chosenStep,product,selected,data.products);
  if(conflicts.length){setPendingChoice(null);notify('Несовместимый компонент: '+conflicts[0].message);return}
 }
 const nextSelection={...selected};
 if(chosenStep==='os'){
  if(osId)nextSelection.os=osId;
  else delete nextSelection.os;
 }else if(product)nextSelection[chosenStep]=product.id;
 setSelected(nextSelection);
 setPendingChoice(null);
 notify(chosenStep==='os'?'Выбрана ОС: '+(osId?osName(osId):'Без ОС'):'Добавлено: '+(product?.name||'компонент'));
 if(!advance)return;
 const currentIndex=steps.findIndex(([key])=>key===chosenStep);
 const nextStep=steps.slice(currentIndex+1).find(([key])=>
  key==='os'?true:key==='extras'?data.products.some(item=>item.category==='peripherals'):
  data.products.some(item=>item.category===key)
 );
 if(!nextStep)return;
 setStep(nextStep[0]);
 setSearch('');
 setShowIncompatible(false);
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
const pendingCurrent=pendingChoice?get(pendingChoice.step):undefined;
const pendingDelta=pendingChoice?.product&&pendingCurrent&&pendingCurrent.price>0&&pendingChoice.product.price>0
 ?pendingChoice.product.price-pendingCurrent.price:null;
const pendingTotal=pendingChoice?.product?total-(pendingCurrent?.price||0)+pendingChoice.product.price:total;
const brandControls=<>{step!=='cpu'&&brands.length>1&&<div><span>Бренд</span><div className="config-filter-buttons"><button className={!activeFilters.brand?'selected':''} onClick={()=>setFilter('brand','')}>Все</button>{brands.map(value=><button key={value} className={activeFilters.brand===value?'selected':''} onClick={()=>setFilter('brand',value)}>{value}</button>)}</div></div>}</>;
const renderComponentOption=({product:p,issues:candidateIssues}:(typeof compatible)[number])=>{
 const conflict=candidateIssues.length>0;
 const isChosen=selected[step]===p.id;
 const current=get(step);
 const delta=current&&current.id!==p.id&&current.price>0&&p.price>0?p.price-current.price:null;
 const displayedPrice=delta===null?(p.price>0?money(p.price):'По запросу'):(delta>0?'+':delta<0?'−':'')+money(Math.abs(delta));
 return <article className={'build-card component-card '+(selected[step]===p.id?'is-picked ':'')+(conflict?'is-incompatible':'')} key={p.id}><div className="config-card-brand"><ProductBrandLogo product={p}/></div><a href={'/product/'+p.id} onClick={e=>{e.preventDefault();nav('/product/'+p.id)}} className="build-card-art">{img(p)}</a><CardActionButtons action="favorite" name={p.name} favorite={favorites.includes(p.id)} compared={compared.includes(p.id)} onFavorite={()=>fav(p.id)} onCompare={()=>compare(p)}/><div className="build-card-body"><h3>{p.name}</h3><div className="config-specs">{(p.category==='gpu'?[p.specs?.vram&&p.specs.vram+' ГБ',p.specs?.videoMemory,p.specs?.interface,p.specs?.dlss&&'DLSS '+p.specs.dlss]:[p.socket,p.memory,p.specs?.capacity&&p.specs.capacity+' ГБ',p.specs?.form]).filter(Boolean).slice(0,4).map((value,i)=><span key={i}>{value}</span>)}</div>{conflict&&<p className="compat-error">{candidateIssues[0].message}</p>}<div className="price-line"><div className="config-card-price"><small>{isChosen?'Выбрано в сборку':delta!==null?'Разница с выбранным':'Цена товара'}</small><strong className={delta===null?'':delta<0?'config-price-decrease':delta>0?'config-price-increase':'config-price-equal'}>{displayedPrice}</strong></div><div className="skp-card-purchase-actions">{isChosen?
 <span className="config-selected-component" role="status" aria-label={'Выбрано в сборку: '+p.name} title="Уже выбран"><Check size={18}/><span>Выбран</span></span>:
 <button type="button" className={'config-add-component'+(current?' config-replace-component':'')} title={conflict?candidateIssues[0].message:current?'Заменить выбранный компонент':'Выбрать и подтвердить'} aria-label={(current?'Заменить на ':'Выбрать ')+p.name} disabled={conflict} onClick={()=>choose(p)}>{current?<><RefreshCw size={18}/><span>Заменить</span></>:<Plus size={22}/>}</button>}</div></div></div></article>;
};
return <><section className="build-page config-page config-studio" aria-label="Конфигуратор ПК"><header className="config-intro"><h1>Конфигуратор <em>ПК</em></h1><div className="config-header-actions"><button onClick={requestSave}><Heart size={16}/> Сохранить</button><details className="config-manage"><summary>Управление <ChevronDown size={14}/></summary><div><button onClick={e=>{openLibrary();e.currentTarget.closest('details')?.removeAttribute('open')}}>Открыть сохранённую</button><button onClick={e=>{setSelected({});e.currentTarget.closest('details')?.removeAttribute('open')}}><RotateCcw size={15}/> Сбросить сборку</button></div></details></div></header>{showSaved&&<SavedBuildLibrary key={savedRevision} selected={selected} products={data.products} onLoad={setSelected} notify={notify}/>}<div className="builder-layout"><aside className="component-steps">{steps.map(([key,label,Icon],i)=><button aria-current={step===key?'step':undefined} className={(step===key?'current ':'')+(get(key)?'completed':'')} key={key} onClick={()=>{setStep(key);setSearch('')}}><span className="step-num">{get(key)?<Check size={14}/>:i+1}</span><Icon size={26}/><span><strong>{label}</strong><small>{key==='os'?(selected.os?osName(selected.os):'Без ОС'):get(key)?.name||(i>7?'Необязательно':'Выберите компонент')}</small></span>{(get(key)||(key==='os'&&selected.os))?<Check size={16}/>:<ChevronRight size={15}/>}</button>)}</aside><div className="component-products" id="skp-builder-options">{step!=='os'&&<div className="config-controls"><div className="config-selection-filters">{step==='cpu'&&<><div><span>Бренд</span><div className="config-filter-buttons">{['AMD','Intel'].map(brand=><button key={brand} aria-pressed={cpuBrand===brand} className={cpuBrand===brand?'selected':''} onClick={()=>{setCpuBrand(current=>current===brand?'':brand);setCpuSocket('')}}>{brand}</button>)}</div></div>{cpuBrand&&cpuSockets.length>0&&<div><span>Сокет</span><div className="config-filter-buttons">{cpuSockets.map(socket=><button key={socket} aria-pressed={cpuSocket===socket} className={cpuSocket===socket?'selected':''} onClick={()=>setCpuSocket(current=>current===socket?'':socket)}>{socket}</button>)}</div></div>}</>}</div>{step!=='cpu'&&<div className="config-color-filter" role="group" aria-label="Цвет компонентов">{([['white','Только белые'],['black','Только чёрные']] as const).map(([color,label])=><button type="button" key={color} aria-pressed={componentColor===color} className={componentColor===color?'selected':''} onClick={()=>setComponentColor(current=>current===color?'':color)}><i className={color} aria-hidden="true"/>{label}</button>)}</div>}<div className="component-search"><div><Search size={15}/><input aria-label="Поиск компонентов" placeholder="Поиск компонента" value={search} onChange={e=>setSearch(e.target.value)}/></div></div><div className="config-brand-filter">{brandControls}</div><div className="config-view-switch" role="group" aria-label="Вид товаров"><button aria-pressed={productView==='carousel'} onClick={()=>setProductView('carousel')}>Карусель</button><button aria-pressed={productView==='list'} onClick={()=>setProductView('list')}>Список</button></div></div>}{step==='gpu'&&gpuModels.length>1&&<div className="config-gpu-models" role="group" aria-label="Модель видеокарты">
  <span>Модель GPU</span><div className="config-gpu-models-list">
   <button type="button" aria-pressed={!gpuModel} className={!gpuModel?'selected':''} onClick={()=>setGpuModel('')}>Все модели</button>
   {gpuModels.map(model=><button key={model} type="button" aria-pressed={gpuModel===model} className={gpuModel===model?'selected':''} onClick={()=>setGpuModel(current=>current===model?'':model)}>{model}</button>)}
  </div>
 </div>}{incompatible.length>0&&compatible.length>0&&<div className="skp-compatible-heading"><ShieldCheck size={16}/><span>Совместимые комплектующие</span><small>{compatible.length}</small></div>}
{step==='os'?<div className="skp-os-options">
 <button type="button" className={!selected.os?'selected':''} onClick={()=>chooseOs('')}><Grid2X2 size={23}/><strong>Без операционной системы</strong><small>Установка ОС не включена</small><b>0 ₽</b></button>
 {BUILD_OS_OPTIONS.map(option=><button type="button" key={option.id} className={selected.os===option.id?'selected':''} onClick={()=>chooseOs(option.id)}><Grid2X2 size={23}/><strong>{option.name}</strong><small>Лицензия оплачивается отдельно — цену уточнит менеджер</small><b>По запросу</b></button>)}
 </div>:productView==='list'?<div className="config-models"><div className="config-models-grid">{compatible.map(renderComponentOption)}</div></div>:<ConfiguratorCarousel key={[step,cpuBrand,cpuSocket,componentColor,activeFilters.brand,search,compatible.map(item=>item.product.id).join(',')].join('|')} cards={compatible.map(renderComponentOption)} names={compatible.map(item=>item.product.name)}/>}
{compatible.length===0&&incompatible.length>0&&<div className="skp-compatible-empty"><ShieldCheck size={22}/><p>Совместимые комплектующие не найдены. Попробуйте изменить выбранные детали или посмотреть ограничения ниже.</p></div>}
{incompatible.length>0&&<div className="skp-builder-incompatible">
 <button type="button" className="skp-incompatible-toggle" aria-expanded={showIncompatible} onClick={()=>setShowIncompatible(value=>!value)}>
  <AlertTriangle size={17}/><span>{showIncompatible?'Скрыть несовместимые':'Показать несовместимые'}</span><small>{incompatible.length}</small><ChevronDown size={16} className={showIncompatible?'expanded':''}/>
 </button>
 {showIncompatible&&<><p className="skp-incompatible-description">Эти детали конфликтуют с текущей конфигурацией. Выбор заблокирован; причины указаны в карточках.</p>
  <div className="component-grid skp-incompatible-grid">{incompatible.map(renderComponentOption)}</div></>}
</div>}{step!=='os'&&!options.length&&<div className="component-empty"><Box size={35}/><h3>{search||componentColor||activeFilters.brand?'Ничего не найдено':'Товары пока не добавлены'}</h3><p>{step==='os'?'Операционная система не обязательна для завершения сборки.':componentColor?'Нет компонентов выбранного цвета. Снимите фильтр цвета или измените параметры.':'Выбери другой раздел или измени поиск.'}</p></div>}</div><details className="config-build-details"><summary>Состав сборки и проверка совместимости <span>{picked.length} компонентов · {problems.length?problems.length+' конфликт(ов)':money(total)}</span><ChevronDown size={18}/></summary><aside className="configuration-panel"><h3>Комплектация <span>{picked.length} выбрано</span></h3>
 {picked.length===0&&!selected.os&&<p className="config-parts-empty">Выбранные компоненты появятся здесь. Добавляйте детали в шагах выше.</p>}
 {steps.slice(0,9).filter(([key])=>key==='os'?Boolean(selected.os):Boolean(get(key))).map(([key,label,Icon])=>{
 const part=get(key);
 const hasOs=key==='os'&&!!selected.os;
 return <div className={'configuration-row'+(part||hasOs?' has-product':'')} key={key}>
  <span className={'configuration-item-art'+(part?' has-image':'')} aria-hidden="true">{part?img(part):<Icon size={23}/>}</span>
  <button type="button" onClick={()=>{setStep(key);setSearch('')}}>
   <span>{label}</span><small className={part||hasOs?'filled':''}>{hasOs?osName(selected.os):part?.name||'Не выбрано'}</small>
   {part&&<strong className="configuration-item-price">{part.price>0?money(part.price):'Цена по запросу'}</strong>}
  </button>
  {(part||hasOs)&&<button type="button" className="configuration-item-remove" aria-label={'Убрать '+label} onClick={()=>{const next={...selected};delete next[key];setSelected(next)}}><X size={14}/></button>}
 </div>;
})}{get('extras')&&<div className="configuration-row has-product">
 <span className="configuration-item-art has-image" aria-hidden="true">{img(get('extras')!)}</span>
 <button type="button" onClick={()=>{setStep('extras');setSearch('')}}><span>Дополнительные опции</span><small className="filled">{get('extras')?.name}</small><strong className="configuration-item-price">{money(get('extras')!.price)}</strong></button>
 <button type="button" className="configuration-item-remove" aria-label="Убрать опцию" onClick={()=>{const n={...selected};delete n.extras;setSelected(n)}}><X size={14}/></button>
 </div>}{picked.length>0&&<div className="skp-assembly-fee-row"><span>Сборка и проверка ПК</span><strong>{money(PC_ASSEMBLY_FEE)}</strong></div>}<BuildDiagnostics analysis={analysis}/><div className="configuration-total"><strong>Итого</strong><strong>{money(total)}</strong></div><div className="config-build-actions"><button className="button light" disabled={!complete||problems.length>0||!addBuild} onClick={()=>{if(!addBuild)return;addBuild({type:'custom-build',id:'build-'+crypto.randomUUID(),selected:{...selected}})}}><ShoppingBag size={16}/> Добавить в корзину</button><button className="button outline" onClick={requestSave}><Heart size={15}/> Сохранить конфигурацию</button></div><small className="config-disclaimer">Несовместимые компоненты нельзя добавить в корзину. Уточните BIOS, разъёмы и размеры перед оформлением.</small></aside></details></div><a className="config-ready-link" href="/pc" onClick={e=>{e.preventDefault();nav('/pc')}}>Посмотреть готовые ПК <ArrowRight size={15}/></a>{pendingChoice&&<div className="config-confirm-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)setPendingChoice(null)}}>
 <div className="config-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="skp-config-confirm-title">
  <div className="config-confirm-header">
   <div><span className="config-confirm-eyebrow">КОНФИГУРАТОР SKP</span><h2 id="skp-config-confirm-title">Подтвердить выбор</h2></div>
   <button type="button" className="config-confirm-close" onClick={()=>setPendingChoice(null)} aria-label="Закрыть"><X size={19}/></button>
  </div>
  <p className="config-confirm-description">Проверьте компонент перед добавлением в сборку. Перейти дальше можно только после подтверждения.</p>
  <div className="config-confirm-rows">
   <div><small>Сейчас в сборке</small><strong>{pendingChoice.step==='os'?(selected.os?osName(selected.os):'Без ОС'):pendingCurrent?.name||'Не выбран'}</strong></div>
   <ArrowRight size={20} aria-hidden="true"/>
   <div><small>Новый выбор</small><strong>{pendingChoice.step==='os'?(pendingChoice.osId?osName(pendingChoice.osId):'Без ОС'):pendingChoice.product?.name}</strong></div>
  </div>
  <div className="config-confirm-total">
   <span>{pendingChoice.step==='os'?'ОС оплачивается отдельно при необходимости':pendingDelta===null?'Итоговая стоимость со сборкой':pendingDelta===0?'Без изменения стоимости':'Изменение стоимости сборки'}</span>
   <strong className={pendingDelta!==null&&pendingDelta<0?'is-cheaper':''}>{pendingDelta===null||pendingChoice.step==='os'?money(pendingTotal):pendingDelta===0?'0 ₽':(pendingDelta>0?'+':'−')+money(Math.abs(pendingDelta))}</strong>
  </div>
  <div className="config-confirm-actions">
   <button ref={confirmCancelRef} type="button" className="config-confirm-cancel" onClick={()=>setPendingChoice(null)}>Отмена</button>
   <button type="button" className="config-confirm-stay" onClick={()=>confirmChoice(false)}>Подтвердить и остаться</button>
   <button type="button" className="config-confirm-next" onClick={()=>confirmChoice(true)}>Подтвердить и продолжить <ArrowRight size={17}/></button>
  </div>
 </div>
</div>}{mobileSaveOpen&&<MobileSaveBuildModal selected={selected} products={data.products} total={total} notify={notify} onClose={()=>setMobileSaveOpen(false)} onSaved={()=>setSavedRevision(n=>n+1)}/>}</section></>}