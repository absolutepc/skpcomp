'use client';
import {ArrowUpRight,MapPin,Navigation,LocateFixed} from 'lucide-react';

export const STORE_ADDRESS='г. Грозный, ул. Нурсултана Назарбаева, 117/7';
export const STORE_COORDS={lat:43.339259,lon:45.700568};

// Coordinates correspond to the verified building on Yandex Maps.
// The iframe is optional: visitors can always follow the direct map and route links.
const point=STORE_COORDS.lon+','+STORE_COORDS.lat;
export const STORE_YANDEX_URL='https://yandex.com/maps/1106/grozniy/house/YEwYcQdgTEMPQFppfX9yeH5mbQ%3D%3D/';
export const STORE_YANDEX_ROUTE='https://yandex.ru/maps/?rtext=~'+STORE_COORDS.lat+'%2C'+STORE_COORDS.lon+'&rtt=auto';
export const STORE_2GIS_URL='https://2gis.ru/grozny/search/'+encodeURIComponent('улица Нурсултана Назарбаева, 117/7');
const iframeUrl='https://yandex.ru/map-widget/v1/?ll='+encodeURIComponent(point)+'&z=17&pt='+encodeURIComponent(point+',pm2rdm');

export default function StoreLocation(){
 return <section className="store-contacts" aria-labelledby="store-location-title">
   <div className="store-contacts-head">
     <div>
       <span className="eyebrow"><MapPin size={14}/> SKP / ГДЕ НАС НАЙТИ</span>
       <h1 id="store-location-title">Контакты <em>и расположение</em></h1>
       <p>Приезжай в SKP — поможем подобрать компьютер, комплектующие и периферию.</p>
     </div>
   </div>
   <div className="store-contacts-layout">
     <div className="store-location-panel">
       <div className="store-location-symbol"><MapPin size={29}/></div>
       <span className="store-location-kicker">АДРЕС МАГАЗИНА</span>
       <h2>SKP — компьютерный магазин</h2>
       <address>{STORE_ADDRESS}</address>
       <p className="store-location-desc">Точка на карте соответствует адресу магазина. Маршрут откроется в выбранном картографическом сервисе.</p>
       <div className="store-location-actions">
         <a className="button light" href={STORE_YANDEX_ROUTE} target="_blank" rel="noopener noreferrer"><Navigation size={17}/> Построить маршрут</a>
         <a className="button outline" href={STORE_2GIS_URL} target="_blank" rel="noopener noreferrer"><LocateFixed size={17}/> Открыть в 2ГИС</a>
       </div>
       <a className="store-location-small-link" href={STORE_YANDEX_URL} target="_blank" rel="noopener noreferrer">Посмотреть здание в Яндекс Картах <ArrowUpRight size={15}/></a>
     </div>
     <div className="store-map-wrap">
       <iframe title="Расположение магазина SKP — Грозный, Назарбаева, 117/7"
         src={iframeUrl} loading="lazy" referrerPolicy="strict-origin-when-cross-origin"
         allowFullScreen/>
       <div className="store-map-bar">
         <span><MapPin size={14}/> Грозный · Нурсултана Назарбаева, 117/7</span>
         <a href={STORE_YANDEX_URL} target="_blank" rel="noopener noreferrer">Открыть карту <ArrowUpRight size={14}/></a>
       </div>
     </div>
   </div>
 </section>;
}
