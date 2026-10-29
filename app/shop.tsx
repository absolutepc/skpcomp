'use client';
import {useState,useEffect} from 'react';
import {brandsForCategory,selectedBrand,seriesForBrand,selectedSeries,gpuChipBrand,gpuChipBrands,gpuBrandsForChip,defaultBrandCatalog,canonicalBrand} from '../lib/product-brands';
import AdminCpuPreset from './admin-cpu-preset';
import {clearCpuPreset} from '../lib/cpu-presets';
import AdminGpuPreset from './admin-gpu-preset';
import {clearGpuPreset} from '../lib/gpu-presets';
import {coolingTypes,liquidRadiatorSizes,isLiquidCooling} from '../lib/cooling-options';
import {popularProducts} from '../lib/popular-products';
import {createColorVariant,saveColorVariant} from '../lib/product-color-variant';
import './admin-color-variant.css';
import './store-usability.css';
import LiveSectionPreview from './live-section-preview';
import CatalogPage from './catalog-page';
import CardActionButtons from './card-action-buttons';
import CatalogProductCard from './catalog-product-card';
import StoreSearch from './store-search';
import {components,peripherals,categoryFields,gpuFieldGroups,ssdFieldGroups,psuFieldGroups,caseFieldGroups,monitorFieldGroups,fieldsForProduct,normalizeProduct,fieldValue} from '../lib/catalog';
import {buildComponentFields} from '../lib/build-components';
import Installments from './installments';
import {Checkout,OrderHistory,AdminOrders} from './orders';
import StoreLocation,{STORE_ADDRESS} from './store-location';
import {ReadyPC,Configurator} from './build-pages';
import './custom-build-cart.css';
import HeroSlider,{InstagramIcon,WhatsAppIcon} from './hero-slider';
import ComparePage,{comparisonCategory} from './compare-page';
import {AdminReviews} from './product-reviews';
import ProductDetailPage from './product-detail-page';
import AdminProductMedia from './admin-product-media';
import AdminHeroSlides from './admin-hero-slides';
import AdminFpsGames from './admin-fps-games';
import AdminDashboard from './admin-dashboard';
import AdminSidebar,{adminSectionFromQuery,type AdminSection} from './admin-sidebar';
import AdminBuildPicker from './admin-build-picker';
import AdminProducts,{inAdminProductSection} from './admin-products';
import AdminBrands from './admin-brands';
import {getProductImages} from '../lib/product-gallery';
import {GitCompareArrows} from 'lucide-react';
import {Search,ArrowUpRight,ArrowRight,Heart,ShoppingBag,SlidersHorizontal,Plus,Minus,X,Check,Camera,MessageCircle,ChevronDown,Menu,Settings,Trash2,LogOut,Monitor,Layers,ShieldCheck,Truck,Cpu,PackageCheck,ChevronRight} from 'lucide-react';
import {seed,Product,Store} from '../lib/seed';
import {cleanCart,summarizeCart,cartGrandTotal,type CartEntry,type CustomBuildCartItem} from '../lib/custom-build-cart';
const cats:Record<string,string>={components:'Комплектующие',peripherals:'Периферия',laptops:'Ноутбуки',furniture:'Компьютерная мебель',pc:'Готовые ПК'};
const parts:Record<string,string>={cpu:'Процессор',motherboard:'Материнская плата',gpu:'Видеокарта',ram:'Оперативная память',ssd:'Накопитель',psu:'Блок питания',case:'Корпус',cooler:'Охлаждение'};
function productColorLabel(product:Product){
 const explicit=fieldValue(product,'color').trim();
 if(explicit)return explicit;
 const colors:Record<string,string>={'#fff':'Белый','#ffffff':'Белый','#000':'Чёрный','#000000':'Чёрный','#ff0000':'Красный','#00ff00':'Зелёный','#0000ff':'Синий','#ffff00':'Жёлтый','#808080':'Серый','#c0c0c0':'Серебристый'};
 return colors[(product.colorHex||'').trim().toLowerCase()]||'';
}
const money=(n:number)=>new Intl.NumberFormat('ru-RU').format(n)+' ₽';
function Logo(){return <svg className="store-logo" viewBox="145 430 825 335" role="img" aria-label="SKP — логотип магазина"><image href="/images/skp-logo.jpg" width="1080" height="1080"/></svg>}
function ReferenceArt({area,className=''}:{area:string;className?:string}){
 const categoryPhotos:Record<string,string>={
  laptops:'/images/category-laptops.jpg',
  components:'/images/category-components.webp',
  peripherals:'/images/category-peripherals.jpg',
  furniture:'/images/category-furniture.jpg'
 };
 if(categoryPhotos[area])return <img className={'reference-art skp-category-photo skp-category-photo-'+area+' '+className}
  src={categoryPhotos[area]} alt={'Фотография категории «'+({laptops:'Ноутбуки',components:'Комплектующие',peripherals:'Периферия',furniture:'Компьютерная мебель'} as Record<string,string>)[area]+'»'}
  loading="lazy" decoding="async"/>;
 const regions:Record<string,string>={hero:'510 67 485 355',components:'50 465 200 130',peripherals:'287 465 207 130',laptops:'528 465 210 130',furniture:'776 463 198 113',build:'267 936 233 135',config:'782 936 198 135'};return <svg className={'reference-art '+className} viewBox={regions[area]||regions.hero} role="img" aria-label={area==='hero'?'Игровой компьютер с жёлтой подсветкой':'Иллюстрация раздела'}><image href="/images/skp-reference.png" width="1024" height="1536"/></svg>}
function Art({kind='pc',dark=false}:{kind?:string;dark?:boolean}){return <svg className={'product-art '+kind} viewBox="0 0 400 330" role="img" aria-label="Иллюстрация товара"><defs><linearGradient id={'g'+kind+(dark?'d':'')} x1="0" y1="0" x2="1" y2="1"><stop stopColor={dark?'#35383c':'#fff'}/><stop offset="1" stopColor={dark?'#0d0f11':'#959da4'}/></linearGradient><radialGradient id="fan"><stop offset=".1" stopColor="#ffed89"/><stop offset=".3" stopColor="#99851a"/><stop offset=".55" stopColor="#24250c"/><stop offset=".75" stopColor="#ffe500"/><stop offset=".9" stopColor="#665c13"/><stop offset="1" stopColor="#11150c"/></radialGradient></defs>
{kind==='pc'?<g><ellipse cx="210" cy="302" rx="131" ry="17" fill="#000" opacity=".35"/><path d="M100 62 266 35 325 70 325 268 160 298 100 259Z" fill={dark?'#191b1d':'#b9bfc4'}/><path d="M100 62 160 94 325 70 266 35Z" fill={dark?'#35383d':'#e0e3e5'}/><path d="M160 94 325 70 325 268 160 298Z" fill={dark?'#25272a':'#e5e8eb'}/><path d="M172 105 309 85 309 251 172 276Z" fill="#1a222b"/><path d="M181 118 243 109 243 195 181 205Z" fill="#27343e"/><g transform="translate(271 133) scale(.72 1)"><circle r="31" fill="url(#fan)"/><circle r="9" fill="#c0cdd5"/></g><g transform="translate(271 208) scale(.72 1)"><circle r="31" fill="url(#fan)"/><circle r="9" fill="#c0cdd5"/></g><path d="M181 208 246 198 246 217 181 227Z" fill="#c5cdd4"/><path d="M110 79 148 100 148 277 110 254Z" fill={dark?'#101216':'#e4e8ec'}/><path d="M120 105 137 115 137 233 120 224Z" fill="#242b30"/><path d="M180 245 299 228" stroke="#ffe500" strokeWidth="3"/><text x="182" y="263" fill="#9ca9b3" fontSize="9">SKP / PERFORMANCE</text></g>:kind==='gpu'?<g transform="translate(48 90) rotate(-10 150 70)"><rect width="300" height="128" rx="10" fill="#b5babe"/><rect x="10" y="10" width="280" height="104" rx="6" fill="#30353b"/>{[60,150,240].map(x=><g key={x}><circle cx={x} cy="62" r="40" fill="url(#fan)"/><circle cx={x} cy="62" r="11" fill="#c2c9ce"/></g>)}<path d="M40 128h140v12H40" fill="#bbaa75"/><text x="170" y="124" fontSize="9" fill="#17191b">GEFORCE RTX</text></g>:kind==='keyboard'?<g transform="translate(35 110) rotate(-8 160 60)"><rect width="330" height="125" rx="10" fill="#a2a9ac"/>{Array.from({length:60},(_,i)=><rect key={i} x={10+(i%15)*21} y={10+Math.floor(i/15)*24} width="18" height="19" rx="3" fill={i%11===0?'#668c9f':'#e3e5de'}/>)}<rect x="90" y="106" width="145" height="10" rx="3" fill="#d8dcd8"/></g>:kind==='mouse'?<g transform="translate(128 50) rotate(-15 70 100)"><path d="M0 90Q0 0 75 0Q150 0 150 90v80Q148 239 75 239Q0 239 0 170Z" fill="#e4e7e9"/><path d="M75 0v100M8 100h134" stroke="#9ca6ad"/><rect x="69" y="30" width="12" height="37" rx="5" fill="#444a51"/><text x="65" y="175" fill="#89969f" fontSize="32">G</text></g>:kind==='monitor'||kind==='laptop'?<g><rect x="45" y="50" width="310" height="198" rx="8" fill="#a1a7ae"/><rect x="53" y="58" width="294" height="181" fill="#1e2b3f"/><path d="M53 200 180 58 347 58 210 239H53Z" fill="#343d64"/><path d="m110 239 140-181h60L180 239" fill="#636f89"/>{kind==='monitor'?<path d="M185 248h30v39h60v8H125v-8h60Z" fill="#abb4bc"/>:<path d="M45 248h310l35 38H10Z" fill="#d3d9df"/>}</g>:kind==='chair'?<g fill="#727c86" stroke="#a5afb5" strokeWidth="4"><rect x="139" y="28" width="123" height="168" rx="42"/><path d="M112 196Q200 167 285 196l-10 34H125Z"/><path d="M200 230v60m-65 10 65-20 65 20m-65-20 8 25M110 185v-35m175 35v-35" fill="none" strokeWidth="10"/></g>:kind==='desk'?<g fill="#b7b7ae"><path d="M40 100 275 65 365 115 130 155Z"/><path d="M55 110v170h12V115m278 10v155h-12V130M135 160v140h12V160"/></g>:kind==='ram'||kind==='ssd'?<g transform="translate(50 115) rotate(-12 150 40)"><rect width="300" height="75" rx="4" fill="#afb6bc"/>{[20,80,140,200,260].map(x=><rect key={x} x={x} y="13" width="28" height="44" fill="#313941"/>)}<rect x="20" y="75" width="260" height="8" fill="#ac9b68"/></g>:<g><rect x="104" y="65" width="192" height="196" rx="6" fill={kind==='cpu'?'#c4cbd1':'#35424a'} stroke="#6f7a80" strokeWidth="8"/><rect x="139" y="100" width="122" height="120" fill="#99a4aa"/>{[80,260].map(y=><path key={y} d={`M110 ${y}h180`} stroke="#c1b783" strokeWidth="5"/>)}<text x="200" y="160" textAnchor="middle" fill="#27333b" fontSize="20">{kind==='cpu'?'RYZEN':kind==='board'?'MSI':kind==='psu'?'750W':'AK400'}</text><text x="200" y="185" textAnchor="middle" fill="#4b5862" fontSize="10">PERFORMANCE SERIES</text></g>}</svg>}
export default function Shop(){const [data,setData]=useState<Store>({...seed,products:seed.products.map(normalizeProduct)});const [path,setPath]=useState('/');const [query,setQuery]=useState('');const [sort,setSort]=useState('popular');const [max,setMax]=useState('');const [favorites,setFavorites]=useState<string[]>([]);const [compared,setCompared]=useState<string[]>([]);const [cart,setCart]=useState<CartEntry[]>([]);const [toast,setToast]=useState('');const [menu,setMenu]=useState(false);const [searchOpen,setSearchOpen]=useState(false);const [selected,setSelected]=useState<Record<string,string>>({});const [auth,setAuth]=useState(false);const [password,setPassword]=useState('');const [editing,setEditing]=useState<Product|null>(null);const [colorSource,setColorSource]=useState<{sourceId:string;draftId:string}|null>(null);const addingColor=!!editing&&colorSource?.draftId===editing.id;const [mobileEditorTab,setMobileEditorTab]=useState<'basic'|'specs'|'gallery'>('basic');const [loaded,setLoaded]=useState(false);const [adminSection,setAdminSection]=useState<AdminSection>('dashboard');
useEffect(()=>{setPath(location.pathname);setAdminSection(adminSectionFromQuery(new URLSearchParams(location.search).get('section')));const pop=()=>{setPath(location.pathname);setAdminSection(adminSectionFromQuery(new URLSearchParams(location.search).get('section')))};window.addEventListener('popstate',pop);try{setFavorites(JSON.parse(localStorage.getItem('skp-favorites')||'[]'));const savedCompare=JSON.parse(localStorage.getItem('skp-compare')||'[]');if(Array.isArray(savedCompare))setCompared(Array.from(new Set(savedCompare.filter((id:unknown)=>typeof id==='string'))).slice(0,2) as string[]);setCart(cleanCart(JSON.parse(localStorage.getItem('skp-cart')||'[]')))}catch{}fetch('/api/store').then(r=>{if(!r.ok)throw Error();return r.json() as Promise<Store>}).then(store=>setData({...store,products:store.products.map(normalizeProduct)})).catch(()=>notify('Не удалось загрузить актуальный каталог. Попробуйте обновить страницу.')).finally(()=>setLoaded(true));api({action:'check'}).then(r=>setAuth(r.ok));return()=>window.removeEventListener('popstate',pop)},[]);

useEffect(()=>{
 if(path!=='/'||!loaded)return;
 let disposed=false;
 let active:AbortController|null=null;
 const refresh=async()=>{
  if(document.hidden||active)return;
  const controller=new AbortController();active=controller;
  try{
   const response=await fetch('/api/store',{cache:'no-store',signal:controller.signal});
   if(!response.ok)return;
   const next=await response.json() as Store;
   if(!disposed&&Array.isArray(next.products))setData({...next,products:next.products.map(normalizeProduct)});
  }catch{/* Keep the last successful catalog on temporary network errors. */}
  finally{active=null}
 };
 const timer=window.setInterval(refresh,30000);
 window.addEventListener('focus',refresh);
 document.addEventListener('visibilitychange',refresh);
 return()=>{disposed=true;active?.abort();window.clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh)};
},[path,loaded]);

const [adminSearch,setAdminSearch]=useState('');
useEffect(()=>{setMobileEditorTab('basic')},[editing?.id]);
function nav(p:string){history.pushState({},'',p);setPath(p);setMenu(false);setSearchOpen(false);setQuery('');window.scrollTo(0,0)}function chooseAdminSection(next:AdminSection){setAdminSearch('');setAdminSection(next);history.replaceState(history.state,'','/admin?section='+next);window.scrollTo({top:0,behavior:'instant'})}function notify(s:string){setToast(s);setTimeout(()=>setToast(''),3500)}async function api(b:any){return fetch('/api/store',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)})}async function save(next:Store):Promise<boolean>{try{const r=await api({data:next});const b=await r.json() as {error?:string};if(!r.ok)throw Error(b.error);setData(next);setEditing(null);notify('Изменения сохранены');return true}catch(e:any){notify(e.message||'Не удалось сохранить');return false}}
function compare(p:Product){
 const all=compared.map(id=>data.products.find(item=>item.id===id)).filter((item):item is Product=>!!item);
 let next=all.map(item=>item.id);
 if(next.includes(p.id)){next=next.filter(id=>id!==p.id)}
 else if(all.length&&comparisonCategory(all[0])!==comparisonCategory(p)){notify('Сравнивать можно только товары одной категории');return}
 else if(next.length>=2){notify('Можно сравнить только два товара. Сначала уберите один из выбранных.');return}
 else next=[...next,p.id];
 setCompared(next);localStorage.setItem('skp-compare',JSON.stringify(next));
 }
 function clearCompare(){setCompared([]);localStorage.removeItem('skp-compare')}
 function removeCompared(id:string){const ids=compared.filter(x=>x!==id);setCompared(ids);localStorage.setItem('skp-compare',JSON.stringify(ids))}
function fav(id:string){const next=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];setFavorites(next);localStorage.setItem('skp-favorites',JSON.stringify(next))}function add(ids:string[]){const next=[...cart,...ids];setCart(next);localStorage.setItem('skp-cart',JSON.stringify(next));notify('Добавлено в корзину')}
function addBuild(item:CustomBuildCartItem){const next=[...cart,item];setCart(next);localStorage.setItem('skp-cart',JSON.stringify(next));notify('Сборка добавлена в корзину одной позицией')}
function remove(id:string){const next=cart.filter(x=>typeof x==='string'?x!==id:x.id!==id);setCart(next);localStorage.setItem('skp-cart',JSON.stringify(next))}
const cartRows=summarizeCart(cart,data.products),cartTotal=cartGrandTotal(cartRows);
const link=(p:string,label:React.ReactNode,cls='')=><a className={cls} href={p} onClick={e=>{e.preventDefault();nav(p)}}>{label}</a>;
const img=(p:Product)=>(getProductImages(p)[0]?<img src={getProductImages(p)[0]} alt={p.name} onError={e=>{e.currentTarget.style.display='none'}}/>:<Art kind={p.art} dark={p.id==='skp-black'}/>);
const card=(p:Product)=>p.category!=='pc'?<CatalogProductCard key={p.id} product={p} brands={data.brands} visual={img(p)} nav={nav} favorite={favorites.includes(p.id)} compared={compared.includes(p.id)} onFavorite={()=>fav(p.id)} onCompare={()=>compare(p)} onAdd={()=>add([p.id])}/>:<article className="card" key={p.id}><div className={"card-image"+((p.variantGroup||p.id==="logitech-pro-x2-superstrike")?" variant-visual":"")}>{link('/product/'+p.id,img(p))}<CardActionButtons action="favorite" name={p.name} favorite={favorites.includes(p.id)} compared={compared.includes(p.id)} onFavorite={()=>fav(p.id)} onCompare={()=>compare(p)}/><span className="brand">{p.brand}</span>{p.category==='pc'&&<span className="tag">SKP BUILD</span>}</div>{link('/product/'+p.id,<h3>{p.name}</h3>)}<p>{p.description}</p><div className="price-line"><strong>{p.price>0?money(p.price):'Цена по запросу'}</strong><div className="skp-card-purchase-actions"><CardActionButtons action="compare" name={p.name} favorite={favorites.includes(p.id)} compared={compared.includes(p.id)} onFavorite={()=>fav(p.id)} onCompare={()=>compare(p)}/><button aria-label={p.price>0?'Добавить в корзину':'Цена не указана'} disabled={p.price===0} onClick={()=>add([p.id])}><ShoppingBag size={18}/></button></div></div><div className="card-meta card-stock"><span>{p.price===0?'Уточните цену и наличие':p.stock?'В наличии':'Под заказ'}</span></div></article>;
const cat=path.split('/')[2];let shown=data.products.filter(p=>path==='/favorites'?favorites.includes(p.id):path==='/pc'?p.category==='pc':!cat||cat==='all'?true:cat==='components'?Object.keys(parts).includes(p.category):p.category===cat).filter(p=>(p.name+' '+p.description).toLowerCase().includes(query.toLowerCase())&&(!max||p.price<=Number(max)));if(sort!=='popular')shown.sort((a,b)=>sort==='low'?a.price-b.price:b.price-a.price);
const product=data.products.find(p=>p.id===cat);const picked=Object.values(selected).map(id=>data.products.find(p=>p.id===id)).filter(Boolean) as Product[];const cpu=picked.find(p=>p.category==='cpu'),board=picked.find(p=>p.category==='motherboard'),ram=picked.find(p=>p.category==='ram'),psu=picked.find(p=>p.category==='psu');const watts=picked.filter(p=>['cpu','gpu'].includes(p.category)).reduce((s,p)=>s+p.watts,100);const problems=[cpu&&board&&cpu.socket!==board.socket?'Сокет процессора и материнской платы не совпадает':'',board&&ram&&board.memory!==ram.memory?'Тип памяти не соответствует материнской плате':'',psu&&psu.watts<watts*1.3?'Недостаточный запас мощности блока питания':''].filter(Boolean);const total=picked.reduce((s,p)=>s+p.price,0);
return <>
{path!=='/admin'&&<div className="topline"><span>Технологии. Характер. Твой SKP.</span><span>Подбор и сборка компьютеров <ArrowUpRight size={13}/></span></div>}
<header className={path==='/admin'?'skp-admin-header':undefined}>
 <div className="header-inner">{link('/',<Logo/>)}
 {path==='/admin'?<div className="skp-admin-header-tools">{link('/',<>На сайт <ArrowUpRight size={17}/></>,'skp-admin-home-link')}</div>:<>
  <nav className={menu?'open':''}>{link('/','Главная',path==='/'?'active':'')}{(['components','peripherals','furniture','laptops'] as const).map(id=>link('/catalog/'+id,cats[id],path==='/catalog/'+id?'active':''))}{link('/pc','Готовые ПК',path==='/pc'?'active':'')}{link('/configurator','Конфигуратор',path==='/configurator'?'active':'')}{link('/contacts','Контакты',path==='/contacts'?'active':'')}</nav>
  <div className="header-tools"><button type="button" aria-label="Открыть поиск товаров" aria-haspopup="dialog" aria-expanded={searchOpen} onClick={()=>{setMenu(false);setSearchOpen(true)}}><Search size={20}/></button>{link('/favorites',<Heart size={20}/>)}{link('/orders',<><PackageCheck size={20}/><span className="visually-hidden">Мои заказы</span></>)}{link('/cart',<><ShoppingBag size={20}/>{cart.length>0&&<b>{cart.length}</b>}</>)}<button className="mobile-menu" onClick={()=>setMenu(!menu)} aria-label="Меню"><Menu/></button></div>
 </>}</div>
</header>
{searchOpen&&<StoreSearch products={data.products} onNavigate={nav} onClose={()=>setSearchOpen(false)}/>}
<main className={path==='/admin'?'skp-admin-workspace':path.startsWith('/catalog/')||path==='/pc'||path==='/configurator'||path==='/compare'?'wide-shop':''}>{path==='/compare'?<ComparePage products={compared.map(id=>data.products.find(p=>p.id===id)).filter((p):p is Product=>!!p)} onRemove={removeCompared} onClear={clearCompare} onAddCart={id=>add([id])} nav={nav}/>:path==='/'?<><HeroSlider nav={nav} items={data.heroSlides}/><section className="category-section"><div className="categories">{Object.entries(cats).filter(([id])=>id!=='pc').map(([id,label])=>link('/catalog/'+id,<><ReferenceArt area={id}/><h3>{label}<span className="circle-arrow"><ArrowRight size={17}/></span></h3></>,'category'))}</div></section><section className="popular-section"><div className="section-head"><h2>Популярные товары</h2>{link('/catalog/all',<>Все товары <ArrowRight size={16}/></>,'text-link yellow')}</div><div className="grid home-products">{popularProducts(data.products).map(card)}{data.products.length===0&&<p>Товары скоро появятся.</p>}</div></section><section className="dual-promos"><div className="promo"><div className="promo-copy"><h2>Готовые ПК</h2><p>Продуманные сборки<br/>для игр, работы и стриминга.</p>{link('/pc',<>Смотреть сборки <ArrowRight size={17}/></>,'button light')}</div><LiveSectionPreview href="/pc" label="Посмотреть готовые ПК" onNavigate={nav}><ReadyPC data={data} nav={nav} img={img} add={add} fav={fav} favorites={favorites} notify={notify} compare={compare} compared={compared}/></LiveSectionPreview></div><div className="promo"><div className="promo-copy"><h2>Конфигуратор ПК</h2><p>Собери компьютер под свои задачи<br/>с проверкой совместимости.</p>{link('/configurator',<>Собрать свой ПК <ArrowRight size={17}/></>,'button light')}</div><LiveSectionPreview href="/configurator" label="Открыть конфигуратор ПК" onNavigate={nav}><Configurator data={data} nav={nav} img={img} add={add} addBuild={addBuild} fav={fav} favorites={favorites} notify={notify} selected={selected} setSelected={setSelected} compare={compare} compared={compared} loaded={false}/></LiveSectionPreview></div></section><section className="quick-section"><div className="section-head"><h2>Популярные категории</h2>{link('/catalog/components',<>Все категории <ArrowRight size={16}/></>,'text-link yellow')}</div><div className="quick-categories">{Object.entries(parts).map(([key,label])=>link('/catalog/'+key,<><Art kind={key==='motherboard'?'board':key==='case'?'pc':key}/><span>{label}</span></>))}</div></section><section className="brand-section"><div className="section-head"><h2>Популярные бренды</h2></div><div className="brands"><span>ASUS</span><span>msi</span><span>GIGABYTE</span><span>ASRock</span><span>PALIT</span><span>intel</span><span>AMD</span><span>NVIDIA</span></div></section></>:path.startsWith('/product/')&&product?<ProductDetailPage key={product.id} product={product} data={data} nav={nav} add={add} fav={fav} compare={compare} favorites={favorites} compared={compared} fallback={<Art kind={product.art}/>} card={card}/>:path.startsWith('/product/')?<section className="empty"><h2>Товар не найден</h2>{link('/catalog/all','Открыть каталог','button light')}</section>:path==='/pc'?<ReadyPC data={data} nav={nav} img={img} add={add} fav={fav} favorites={favorites} notify={notify} compare={compare} compared={compared}/>:path==='/configurator'?<Configurator data={data} nav={nav} img={img} add={add} addBuild={addBuild} fav={fav} favorites={favorites} notify={notify} selected={selected} setSelected={setSelected} compare={compare} compared={compared} loaded={loaded}/>:path.startsWith('/catalog/')?<CatalogPage key={cat} category={cat||'all'} products={data.products} nav={nav} card={card}/>:path==='/installments'?<Installments products={data.products} cart={cart} whatsapp={data.whatsapp} nav={nav}/>:path==='/checkout'?<Checkout cart={cart} products={data.products} whatsapp={data.whatsapp} nav={nav} onSuccess={()=>{setCart([]);localStorage.removeItem('skp-cart')}}/>:path==='/orders'?<OrderHistory nav={nav}/>:path==='/cart'?<section className="skp-cart-page"><span className="eyebrow">ТВОЙ ВЫБОР</span><h1>Корзина</h1>{cartRows.length?<div className="config-layout"><div>{cartRows.map(row=>row.build?<article className="cart-item skp-custom-build-cart" key={row.id}>
 <div className="skp-custom-build-art"><Cpu size={34}/></div>
 <div className="skp-custom-build-info"><h3>{row.name}</h3><p>1 сборка</p><details><summary>Посмотреть комплектацию ({row.details?.length||0} деталей)</summary>
 <div className="skp-custom-build-parts">{row.details?.map(part=><div key={part.slot}><span><b>{part.label}</b> — {part.name}</span><strong>{money(part.price)}</strong></div>)}
 <div><span>Операционная система: {row.os}</span><small>Лицензия не включена в цену</small></div>
 <div className="skp-custom-build-assembly"><span>Сборка и проверка ПК</span><strong>{money(row.assemblyFee||0)}</strong></div></div></details>
 {!row.valid&&<small className="skp-build-warning">Комплектация изменилась — проверьте наличие и цены.</small>}</div>
 <div className="skp-cart-line-actions"><strong className="skp-cart-line-price">{money(row.price)}</strong><button type="button" aria-label="Удалить сборку" onClick={()=>remove(row.id)}><Trash2 size={18}/></button></div>
 </article>:<div className="cart-item" key={row.id}><div>{row.product?img(row.product):<ShoppingBag size={27}/>}</div><div>{row.product?link('/product/'+row.product.id,<h3>{row.name}</h3>):<h3>{row.name}</h3>}<p>{row.quantity} шт.{row.quantity>1?' × '+money(row.price):''}</p></div><div className="skp-cart-line-actions"><strong className="skp-cart-line-price">{money(row.price*row.quantity)}</strong><button type="button" aria-label={'Удалить '+row.name} onClick={()=>remove(row.id)}><Trash2 size={18}/></button></div></div>)}</div><aside className="summary"><h3>Твой заказ</h3><div className="sum skp-cart-order-total">{money(cartTotal)}</div>{link('/checkout',<>Оформить заказ <ArrowRight size={18}/></>,'button light skp-checkout-cart-button')}{data.whatsapp?<a className="button outline" target="_blank" rel="noreferrer" href={'https://wa.me/'+data.whatsapp+'?text='+encodeURIComponent('Здравствуйте! Хочу заказать в SKP:\n'+cartRows.map(row=>row.name+' × '+row.quantity+' — '+money(row.price)+(row.build?'\n'+row.details?.map(p=>p.label+': '+p.name).join('\n')+'\nОС: '+row.os+'\nСборка и проверка: '+money(row.assemblyFee||0):'')).join('\n\n'))}>Обсудить заказ <MessageCircle size={20}/></a>:<p className="note">Магазин ещё не указал номер WhatsApp для заказов. Добавьте его в админской панели.</p>}{link('/installments',<>Оплата частями <ArrowRight size={18}/></>,'button outline installment-cart-button')}<small>Статус заказа можно отслеживать в разделе «Мои заказы». Наличие и оплату подтверждает менеджер.</small></aside></div>:<div className="empty"><ShoppingBag size={44}/><h2>Пока ничего нет</h2>{link('/catalog/all','Перейти в каталог','button light')}</div>}</section>:path==='/contacts'?<StoreLocation/>:path==='/admin'?<section className="skp-admin-page">
<div className="section-head skp-admin-old-title"><div><span className="eyebrow">SKP / УПРАВЛЕНИЕ</span><h1>Административная панель</h1></div>
{auth&&<button onClick={async()=>{await api({action:'logout'});setAuth(false)}}><LogOut/> Выйти</button>}</div>
{!auth?<form className="login" onSubmit={async e=>{e.preventDefault();const r=await api({action:'login',password});if(r.ok){setAuth(true);setPassword('')}else notify('Неверный пароль')}}><h2>Вход для владельца</h2><label>Пароль<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="button light">Войти <ArrowRight size={18}/></button></form>:
<AdminSidebar active={adminSection} onChange={chooseAdminSection}
 search={adminSearch} onSearch={setAdminSearch}
 onLogout={async()=>{await api({action:'logout'});setAuth(false);setEditing(null)}}
 productsCount={data.products.filter(p=>inAdminProductSection(p,'products')).length}
 laptopsCount={data.products.filter(p=>inAdminProductSection(p,'laptops')).length}
 pcsCount={data.products.filter(p=>inAdminProductSection(p,'pcs')).length}>
 {adminSection==='dashboard'&&<AdminDashboard products={data.products} search={adminSearch} onOrders={()=>chooseAdminSection('orders')}
  onAdd={()=>setEditing({id:'product-'+Date.now(),name:'',category:'cpu',price:0,art:'cpu',description:'',image:'',stock:true,brand:'',socket:'',memory:'',watts:0})}
  onEdit={product=>setEditing(normalizeProduct(product))}
  onDelete={product=>{if(confirm('Удалить '+product.name+'?'))void save({...data,products:data.products.filter(p=>p.id!==product.id)})}}
 />}
 {adminSection==='contacts'&&<>
  <form className="admin-settings" onSubmit={e=>{e.preventDefault();void save(data)}}>
   <h2>Контакты</h2>
   <div className="form-grid">
    <label>Ссылка Instagram<input placeholder="https://www.instagram.com/…" value={data.instagram} onChange={e=>setData({...data,instagram:e.target.value})}/></label>
    <label>WhatsApp — номер без плюса<input placeholder="79XXXXXXXXX" value={data.whatsapp} onChange={e=>setData({...data,whatsapp:e.target.value})}/></label>
   </div>
   <button className="button outline" disabled={!loaded}>Сохранить контакты</button>
  </form>
  <div className="skp-admin-information">
   <h3>Информация о магазине</h3>
   <p>Адрес магазина: {STORE_ADDRESS}. Контактные данные используются на страницах магазина и в оформлении заказов.</p>
   {link('/contacts','Посмотреть страницу контактов')}
  </div>
 </>}
 <div hidden={adminSection!=='slides'}><AdminHeroSlides slides={data.heroSlides} onSave={slides=>save({...data,heroSlides:slides})}/></div>
 {adminSection==='fps-games'&&<AdminFpsGames games={data.fpsGames} onSave={fpsGames=>save({...data,fpsGames})}/>}
 {adminSection==='brands'&&<AdminBrands brands={data.brands??defaultBrandCatalog(data.products)} products={data.products}
  onSave={async(brand,previousId)=>{
   const previous=(data.brands??defaultBrandCatalog(data.products)).find(entry=>entry.id===previousId);
   const existingBrands=data.brands??defaultBrandCatalog(data.products);
   const brands=existingBrands.some(entry=>entry.id===brand.id)
    ?existingBrands.map(entry=>entry.id===brand.id?brand:entry)
    :[...existingBrands,brand];
   const products=previous&&previous.name!==brand.name
    ?data.products.map(product=>canonicalBrand(product.brand).toLowerCase()===previous.name.toLowerCase()?{...product,brand:brand.name}:product)
    :data.products;
   return save({...data,brands,products});
  }}
  onDelete={async id=>{
   const existing=(data.brands??defaultBrandCatalog(data.products)).find(entry=>entry.id===id);
   if(!existing)return false;
   // Removing a manufacturer from the selector must never delete existing products.
   return save({...data,brands:(data.brands??defaultBrandCatalog(data.products)).filter(entry=>entry.id!==id)});
  }}
 />}
 {(adminSection==='products'||adminSection==='pcs'||adminSection==='laptops')&&<AdminProducts
  key={adminSection}
  products={data.products} section={adminSection} search={adminSearch}
  onAdd={category=>setEditing({id:'product-'+Date.now(),name:'',category:category.startsWith('furniture-')?'furniture':category,price:0,
   art:({'furniture-chair':'chair','furniture-desk':'desk',pc:'pc',laptops:'laptop',motherboard:'board',furniture:'chair'} as Record<string,string>)[category]||category,
   description:'',image:'',stock:true,brand:'',socket:'',memory:'',watts:0})}
  onEdit={product=>setEditing(normalizeProduct(product))}
  onDelete={product=>{if(confirm('Удалить '+product.name+'?'))void save({...data,products:data.products.filter(p=>p.id!==product.id)})}}
 />}
 {adminSection==='orders'&&<AdminOrders products={data.products}/>}
 {adminSection==='reviews'&&<AdminReviews/>}
</AdminSidebar>}
</section>:<section><div className="breadcrumb">SKP / {path==='/favorites'?'Избранное':'Каталог'}</div><h1>{path==='/favorites'?'Избранное':path==='/pc'?'Готовые ПК':cats[cat]||parts[cat]||'Каталог'}</h1>{path!=='/favorites'&&<div className="catalog-tabs">{link('/catalog/all','Все товары',!cat||cat==='all'?'selected':'')}{Object.entries(cats).filter(([id])=>id!=='pc').map(([id,label])=>link('/catalog/'+id,label,cat===id?'selected':''))}</div>}<div className="filters"><div className="search"><Search size={18}/><input id="search" placeholder="Найти свой следующий апгрейд" value={query} onChange={e=>setQuery(e.target.value)}/></div><input className="max-price" type="number" min="0" placeholder="Цена до, ₽" value={max} onChange={e=>setMax(e.target.value)}/><select aria-label="Сортировка" value={sort} onChange={e=>setSort(e.target.value)}><option value="popular">По умолчанию</option><option value="low">Сначала дешевле</option><option value="high">Сначала дороже</option></select></div><div className="result-count">{shown.length} товаров</div><div className="grid">{shown.map(card)}</div>{!shown.length&&<div className="empty"><h2>{path==='/favorites'?'Сохраняй то, что нравится':'Ничего не найдено'}</h2><p>Нажми на сердечко в карточке или измени условия поиска.</p>{link('/catalog/all','В каталог','button outline')}</div>}</section>}</main>
{compared.length>0&&path!=='/compare'&&<div className="skp-compare-float" role="status"><GitCompareArrows size={19}/><span>В сравнении: {compared.length} / 2</span><button type="button" onClick={()=>nav('/compare')}>Сравнить</button><button type="button" onClick={clearCompare} aria-label="Очистить сравнение"><X size={14}/></button></div>}
<footer><div className="footer-top"><div>{link('/',<Logo/>)}<p>Компьютеры. Комплектующие.<br/>Периферия.</p></div><div><h4>КАТАЛОГ</h4>{Object.entries(cats).filter(([id])=>id!=='pc').map(([id,label])=><div key={id}>{link('/catalog/'+id,label)}</div>)}</div><div><h4>ТВОЙ SKP</h4><div>{link('/pc','Готовые ПК')}</div><div>{link('/configurator','Конфигуратор')}</div><div>{link('/orders','Мои заказы')}</div><div>{link('/favorites','Избранное')}</div><div>{link('/compare','Сравнение товаров'+(compared.length?' ('+compared.length+')':''))}</div><div>{link('/contacts','Контакты и адрес')}</div><div>{link('/admin','Административная панель')}</div></div><div><h4>ОСТАВАЙСЯ НА СВЯЗИ</h4><div className="store-footer-location">{link('/contacts',<><span className="store-footer-location-title">Наш магазин <ArrowUpRight size={14}/></span><span>{STORE_ADDRESS}</span></>)}</div><a className="social" href={data.instagram||'https://www.instagram.com/'} target="_blank" rel="noreferrer"><InstagramIcon/> Instagram <ArrowUpRight size={16}/></a><a className="social" href={data.whatsapp?'https://wa.me/'+data.whatsapp:'https://www.whatsapp.com/'} target="_blank" rel="noreferrer"><WhatsAppIcon/> WhatsApp <ArrowUpRight size={16}/></a>{!data.whatsapp&&<small>Контакты магазина пока не указаны</small>}</div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} SKP. Все права защищены.</span><span>BUILT FOR YOU ↗</span></div></footer>
{toast&&<div className="toast" role="status"><Check size={18}/>{toast}</div>}{editing&&<div className="modal-backdrop skp-admin-edit-backdrop"><form className="modal" onSubmit={e=>{e.preventDefault();if(!editing.name.trim()){setMobileEditorTab('basic');notify('Укажите название товара');return;}const brand=selectedBrand(editing,data.products,data.brands);if(editing.category==='gpu'&&!gpuChipBrand(editing)){setMobileEditorTab('basic');notify('Выберите производителя графического процессора');return;}if(!brand&&brandsForCategory(editing.category,data.products,data.brands).length){setMobileEditorTab('basic');notify('Выберите бренд для этой категории');return;}const updated={...editing,brand,specs:{...editing.specs,brandSeries:selectedSeries(editing,data.brands),...(editing.category==='gpu'?{gpuChipBrand:gpuChipBrand(editing)}:{})}};try{const products=addingColor&&colorSource?saveColorVariant(data.products,updated,colorSource.sourceId):data.products.some(p=>p.id===editing.id)?data.products.map(p=>p.id===editing.id?updated:p):[...data.products,updated];void save({...data,products})}catch(error){setMobileEditorTab('basic');notify(error instanceof Error?error.message:'Не удалось создать цвет')}}}><div className="section-head"><h2>{data.products.some(p=>p.id===editing.id)?'Редактировать товар':addingColor?'Добавить цвет':'Добавить товар'}</h2><button type="button" onClick={()=>setEditing(null)} aria-label="Закрыть"><X/></button></div>
{data.products.some(p=>p.id===editing.id)&&<div className="skp-admin-color-action"><button type="button" className="button outline" onClick={()=>{const source=data.products.find(p=>p.id===editing.id)!;const id='product-'+crypto.randomUUID();const draft=createColorVariant({...editing,variantGroup:source.variantGroup},id);setColorSource({sourceId:source.id,draftId:id});setMobileEditorTab('basic');setEditing(draft)}}><Plus size={16}/> Добавить цвет</button><p>Скопировать параметры в новый цветовой вариант с отдельной галереей.</p></div>}
{addingColor&&<p className="skp-admin-color-note" role="status">Параметры скопированы. Укажите название и HEX-код нового цвета, загрузите фотографии и проверьте наличие. Вариант появится в общей группе после сохранения.</p>}
<div className="skp-admin-mobile-editor-tabs" role="tablist" aria-label="Разделы редактора товара">
 {([['basic','Основное'],['specs','Характеристики'],['gallery','Галерея']] as const).map(([id,label])=>
  <button key={id} type="button" role="tab" aria-selected={mobileEditorTab===id} onClick={()=>setMobileEditorTab(id)}>{label}</button>)}
</div>
<div className={'skp-admin-edit-section'+(mobileEditorTab==='basic'?' mobile-selected':'')}><h3 className="skp-admin-mobile-editor-heading">Основная информация</h3><div className="form-grid">{[['name','Название'],['price','Цена, ₽'],['image','HTTPS-ссылка фотографии'],['description','Описание и характеристики'],['variantGroup','Группа цветовых вариантов'],['colorHex','Цвет переключателя (HEX, например #FFFFFF)']].map(([key,label])=><label key={key} title={key==='variantGroup'?'Один и тот же код для всех цветов одной модели':undefined}>{label}<input readOnly={addingColor&&key==='variantGroup'} required={key==='name'&&mobileEditorTab==='basic'} type={['price','watts'].includes(key)?'number':'text'} min="0" value={String((editing as any)[key]??'')} onChange={e=>setEditing({...editing,[key]:['price','watts'].includes(key)?Number(e.target.value):e.target.value})}/></label>)}{editing.category==='gpu'&&<label>Производитель графического процессора<select value={gpuChipBrand(editing)} onChange={e=>{
 const chip=e.target.value as 'NVIDIA'|'AMD'|'Intel'|'';
 const maker=selectedBrand(editing,data.products,data.brands);
 const brand=gpuBrandsForChip(chip,data.brands).includes(maker)?maker:'';
 setEditing({...clearGpuPreset(editing),brand,specs:{...clearGpuPreset(editing).specs,gpuChipBrand:chip,brandSeries:brand?selectedSeries(editing,data.brands):''}});
 }}><option value="">Выберите производителя GPU</option>{gpuChipBrands.map(chip=><option key={chip} value={chip}>{chip}</option>)}</select></label>}
 {editing.category==='gpu'&&<AdminGpuPreset key={editing.id+':'+gpuChipBrand(editing)} product={editing} chip={gpuChipBrand(editing)} onChange={setEditing}/>}
 <label>{editing.category==='gpu'?'Производитель видеокарты':'Бренд'}<select value={selectedBrand(editing,data.products,data.brands)} onChange={e=>{const draft=editing.category==='cpu'?clearCpuPreset(editing):editing;setEditing({...draft,brand:e.target.value,specs:{...draft.specs,brandSeries:''}})}}><option value="">Выберите бренд</option>{selectedBrand(editing,data.products,data.brands)&&!(editing.category==='gpu'?gpuBrandsForChip(gpuChipBrand(editing),data.brands):brandsForCategory(editing.category,data.products,data.brands)).includes(selectedBrand(editing,data.products,data.brands))&&<option value={selectedBrand(editing,data.products,data.brands)}>{selectedBrand(editing,data.products,data.brands)} (ранее указан)</option>}{(editing.category==='gpu'?gpuBrandsForChip(gpuChipBrand(editing),data.brands):brandsForCategory(editing.category,data.products,data.brands)).map(brand=><option key={brand} value={brand}>{brand}</option>)}</select></label>{seriesForBrand(selectedBrand(editing,data.products,data.brands),editing.category,data.brands).length>0&&<label>{editing.category==='cooler'?'Серия системы охлаждения':'Серия / линейка'}<select value={selectedSeries(editing,data.brands)} onChange={e=>setEditing({...editing,specs:{...editing.specs,brandSeries:e.target.value}})}><option value="">Без серии</option>{selectedSeries(editing,data.brands)&&!seriesForBrand(selectedBrand(editing,data.products,data.brands),editing.category,data.brands).includes(selectedSeries(editing,data.brands))&&<option value={selectedSeries(editing,data.brands)}>{selectedSeries(editing,data.brands)} (ранее задана)</option>}{seriesForBrand(selectedBrand(editing,data.products,data.brands),editing.category,data.brands).map(series=><option key={series} value={series}>{series}</option>)}</select></label>}{editing.category==='cpu'&&<AdminCpuPreset key={editing.id+':'+editing.brand} product={editing} onChange={setEditing}/>}<label>Название цвета<input type="text" maxLength={300} placeholder="Например, белый или чёрный" value={fieldValue(editing,'color')} onChange={e=>setEditing({...editing,specs:{...editing.specs,color:e.target.value}})}/></label><label>Раздел<select disabled={addingColor} value={editing.category} onChange={e=>setEditing({...editing,category:e.target.value,brand:selectedBrand({...editing,category:e.target.value},data.products,data.brands),specs:{...editing.specs,brandSeries:selectedSeries({...editing,category:e.target.value},data.brands)}})}>{Object.entries({...components,...cats,...peripherals}).filter(([k])=>k!=='components').map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label><label>Иллюстрация<select value={editing.art} onChange={e=>setEditing({...editing,art:e.target.value})}>{['pc','gpu','cpu','board','ram','ssd','psu','cooler','keyboard','mouse','monitor','laptop','chair','desk'].map(x=><option key={x}>{x}</option>)}</select></label></div><label className="checkbox"><input type="checkbox" checked={editing.stock} onChange={e=>setEditing({...editing,stock:e.target.checked})}/> В наличии</label></div><div className={'skp-admin-edit-section'+(mobileEditorTab==='gallery'?' mobile-selected':'')}><AdminProductMedia key={editing.id} product={editing} change={update=>setEditing(previous=>previous&&previous.id===editing.id?update(previous):previous)}/></div><div className={'skp-admin-edit-section'+(mobileEditorTab==='specs'?' mobile-selected':'')}>{editing.category==='pc'&&<div className="admin-build-components">
  <h3>Комплектация готового ПК</h3>
  <p>Выбери детали из каталога или укажи модели вручную. В списках доступны и товары без наличия. Названия выбранных деталей сохраняются в составе ПК; их можно дополнить, например количеством модулей или вентиляторов.</p>
  <div className="form-grid">
    {buildComponentFields.map(field=><label key={field.key}>{field.label}
      <AdminBuildPicker field={field.key} products={data.products} value={editing.buildComponents?.[field.key]||''} onSelect={part=>setEditing({...editing,buildComponents:{...editing.buildComponents,[field.key]:part.name.slice(0,300)}})}/>
      <input type="text" maxLength={300} placeholder={field.placeholder} value={editing.buildComponents?.[field.key]||''} onChange={e=>setEditing({...editing,buildComponents:{...editing.buildComponents,[field.key]:e.target.value}})}/>
    </label>)}
  </div>
  <div className="admin-build-extra-heading"><h4>Другие комплектующие</h4><button type="button" className="button outline" disabled={(editing.buildExtras||[]).length>=20} onClick={()=>setEditing({...editing,buildExtras:[...(editing.buildExtras||[]),{name:'',value:''}]})}><Plus size={15}/> Добавить компонент</button></div>
  {(editing.buildExtras||[]).map((part,index)=><div className="admin-build-extra-row" key={index}>
    <label>Название компонента<input type="text" maxLength={80} placeholder="Например, звуковая карта" value={part.name} onChange={e=>setEditing({...editing,buildExtras:(editing.buildExtras||[]).map((item,i)=>i===index?{...item,name:e.target.value}:item)})}/></label>
    <label>Модель / характеристики<AdminBuildPicker field="extra" products={data.products} value={part.value} onSelect={selected=>setEditing({...editing,buildExtras:(editing.buildExtras||[]).map((item,i)=>i===index?{...item,name:item.name||components[selected.category]||'Компонент',value:selected.name.slice(0,300)}:item)})}/><input type="text" maxLength={300} placeholder="Точная модель" value={part.value} onChange={e=>setEditing({...editing,buildExtras:(editing.buildExtras||[]).map((item,i)=>i===index?{...item,value:e.target.value}:item)})}/></label>
    <button type="button" className="admin-build-remove" aria-label="Удалить компонент" title="Удалить компонент" onClick={()=>setEditing({...editing,buildExtras:(editing.buildExtras||[]).filter((_,i)=>i!==index)})}><Trash2 size={18}/></button>
  </div>)}
</div>}{editing.category!=='pc'&&<div className="admin-spec-fields"><h3>Характеристики для фильтров</h3><p>Заполняйте только известные значения. Несколько вариантов разделяйте символом |, например DDR4 | DDR5. Числа указывайте без единиц измерения.</p>{(editing.category==='gpu'||editing.category==='ssd'||editing.category==='psu'||editing.category==='case'||editing.category==='monitor')
 ?(editing.category==='gpu'?gpuFieldGroups:editing.category==='ssd'?ssdFieldGroups:editing.category==='psu'?psuFieldGroups:editing.category==='case'?caseFieldGroups:monitorFieldGroups).map(group=><section className="skp-technical-spec-group" key={group.title}>
  <h4>{group.title}</h4>
  {editing.category==='ssd'&&group.title==='Кэширование'&&<p className="skp-storage-spec-note">DRAM-кэш указывайте в МБ (0, если его нет). pSLC-кэш бывает статическим или динамическим: максимальный объём указывайте только если он известен. HMB заполняется отдельно.</p>}
  {editing.category==='psu'&&group.title==='Разъёмы и кабели'&&<p className="skp-storage-spec-note">Указывайте количество физических разъёмов на кабелях, а не количество кабелей. 12V-2x6 и 12VHPWR различаются: уточните тип по данным производителя.</p>}
  {editing.category==='psu'&&group.title==='Защиты, надёжность и габариты'&&<p className="skp-storage-spec-note">Защиты перечисляйте через |, например OVP | OCP | SCP. Не отмечайте неподтверждённые защиты и сертификаты.</p>}
  {editing.category==='case'&&group.title==='Вентиляторы и воздушный поток'&&<p className="skp-storage-spec-note">«Вентиляторы в комплекте» — только установленные производителем. «Всего мест» — максимальное количество поддерживаемых. Расположение и размеры указывайте отдельно, например 3×120 / 2×140.</p>}
  {editing.category==='case'&&group.title==='Совместимость с жидкостным охлаждением'&&<p className="skp-storage-spec-note">Перечисляйте допустимые размеры радиаторов по каждой стороне, например 240 | 280 | 360. Не считайте поддержку вентиляторов гарантией совместимости с радиатором.</p>}
  {editing.category==='monitor'&&group.title==='Частота обновления и игровые возможности'&&<p className="skp-storage-spec-note">Для Dual-Mode отдельно указывайте частоту и разрешение каждого режима. GtG и MPRT — разные методы измерения времени отклика, не объединяйте их в одно значение.</p>}
  {editing.category==='monitor'&&group.title==='Яркость, контрастность и HDR'&&<p className="skp-storage-spec-note">Типичная SDR, пиковая HDR и яркость HDR на всём экране — разные показатели. Контрастность можно указать числом или отношением, например 1500 или 1500:1. Заполняйте только подтверждённые производителем данные.</p>}
  {editing.category==='monitor'&&group.title==='Цветопередача и качество изображения'&&<p className="skp-storage-spec-note">Цветовые охваты указывайте отдельно для sRGB, DCI-P3, Adobe RGB и Rec.2020. Не путайте процент охвата и объём цветового пространства.</p>}
  <div className="form-grid">{group.fields.filter(field=>(field.key!=='color'||editing.category==='monitor'||editing.category==='case')&&(!field.chip||field.chip===gpuChipBrand(editing))).map(field=><label key={field.key}>{field.label}{field.unit?`, ${field.unit}`:''}<input type={field.numeric?'number':'text'} min={field.numeric?0:undefined} step={field.numeric?'any':undefined} value={fieldValue(editing,field.key)} onChange={e=>setEditing({...editing,...(['socket','memory'].includes(field.key)?{[field.key]:e.target.value}:field.key==='watts'?{watts:Number(e.target.value)}:{}),specs:{...editing.specs,[field.key]:e.target.value}})}/></label>)}</div>
 </section>)
 :<div className="form-grid">{fieldsForProduct(editing).filter(field=>field.key!=='color').map(field=>{
 const value=fieldValue(editing,field.key);
 if(editing.category==='cooler'&&field.key==='coolingType')return <label key={field.key}>Тип охлаждения
  <select value={value} onChange={e=>setEditing({...editing,specs:{...editing.specs,coolingType:e.target.value,radiator:e.target.value===value?fieldValue(editing,'radiator'):''}})}>
   <option value="">Выберите тип охлаждения</option>
   {coolingTypes.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}
   {value&&!coolingTypes.some(option=>option.value===value)&&<option value={value}>{value}</option>}
  </select>
 </label>;
 if(editing.category==='cooler'&&field.key==='radiator'&&isLiquidCooling(fieldValue(editing,'coolingType')))return <label key={field.key}>Размер радиатора, мм
  <select value={value} onChange={e=>setEditing({...editing,specs:{...editing.specs,radiator:e.target.value}})}>
   <option value="">Выберите размер радиатора</option>
   {liquidRadiatorSizes.map(size=><option key={size} value={size}>{size} мм</option>)}
   {value&&!liquidRadiatorSizes.some(size=>size===value)&&<option value={value}>{value} мм (ранее задано)</option>}
  </select>
 </label>;
 if(editing.category==='motherboard'&&field.key==='powerPhases')return <label key={field.key}>Фазы питания процессора (VRM), шт.
  <input type="number" min={1} step={1} placeholder="Например, 16" value={value} onChange={e=>setEditing({...editing,specs:{...editing.specs,powerPhases:e.target.value}})}/>
  <small>Укажите количество фаз CPU: для схемы 16+2+1 — 16. Большее число даст больший показатель на диаграмме.</small>
 </label>;
 if(editing.category==='ram'&&field.key==='bandwidth'){
  const storedMBps=editing.specs?.bandwidthMBps;
  const legacyGBps=editing.specs?.bandwidth?.trim().replace(',','.')||'';
  const legacyMBps=/^\d+(?:\.\d+)?$/.test(legacyGBps)?String(Number(legacyGBps)*1000):'';
  return <label key={field.key}>Пропускная способность, МБ/с
   <input type="number" min={0} step="any" placeholder="Например, 76800" value={storedMBps!==undefined?storedMBps:legacyMBps} onChange={e=>setEditing({...editing,specs:{...editing.specs,bandwidthMBps:e.target.value,bandwidth:''}})}/>
   <small>Введите значение в МБ/с. На сайте и диаграмме оно появится в ГБ/с (1000 МБ/с = 1 ГБ/с).</small>
  </label>;
 }
 return <label key={field.key}>{field.label}{field.unit?`, ${field.unit}`:''}
  <input type={field.numeric?'number':'text'} min={field.numeric?0:undefined} step={field.numeric?'any':undefined} value={value} onChange={e=>setEditing({...editing,...(['socket','memory'].includes(field.key)?{[field.key]:e.target.value}:field.key==='watts'?{watts:Number(e.target.value)}:{}),specs:{...editing.specs,[field.key]:e.target.value}})}/>
 </label>;
})}</div>}{!categoryFields[editing.category]&&<small>Выберите подраздел товара, чтобы заполнить его характеристики.</small>}</div>}</div><button className="button light skp-admin-edit-save">Сохранить товар <Check size={18}/></button></form></div>}</>}
