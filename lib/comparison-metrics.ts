import type {Product} from './seed';
import {fieldValue} from './catalog';
import {gpuChipBrand} from './product-brands';
import {estimateFps,fromLaptop,fromReadyPC} from './fps-estimate';

export type RadarMetric={key:string;label:string;unit:string;lowerBetter?:boolean;read:(p:Product)=>number|null;display?:(p:Product)=>string};
export function numericValue(raw:string):number|null{
 if(!/^\s*\d+(?:[.,]\d+)?\s*$/.test(raw))return null;
 const value=Number(raw.trim().replace(',','.'));
 return Number.isFinite(value)?value:null;
}
const metric=(key:string,label:string,unit='',lowerBetter=false):RadarMetric=>({key,label,unit,lowerBetter,read:p=>key==='price'?(p.price>0?p.price:null):numericValue(fieldValue(p,key))});
const cudaCores:RadarMetric={key:'cudaCores',label:'CUDA-ядра',unit:'',read:p=>gpuChipBrand(p)==='NVIDIA'?numericValue(fieldValue(p,'cudaCores')):null};
/** 80 PLUS is an ordered efficiency certification, not a numerical power spec.
 * Unknown and other certification systems are intentionally not compared.
 */
export function psuCertificateTier(raw:string):number|null{
 const value=raw.trim().toLowerCase();
 if(!value||/cybenetics|eta|lambda/i.test(value))return null;
 if(/titanium|титаниум|титановой/i.test(value))return 6;
 if(/platinum|платин/i.test(value))return 5;
 if(/gold|золот/i.test(value))return 4;
 if(/silver|серебр/i.test(value))return 3;
 if(/bronze|бронз/i.test(value))return 2;
 if(/standard|white|стандарт|белый/i.test(value)||/^80\s*(?:plus|\+)$/i.test(value))return 1;
 return null;
}
const certificate:RadarMetric={
 key:'certificate',label:'Сертификат',unit:'',
 read:p=>psuCertificateTier(fieldValue(p,'certificate')),
 display:p=>{
  const raw=fieldValue(p,'certificate').trim();
  if(psuCertificateTier(raw)===null)return '—';
  return raw;
 }
};
const price=metric('price','Цена','₽',true);
const fps=(game:string,label:string):RadarMetric=>({key:'fps-'+game,label,unit:'FPS ≈',read:p=>{
 const rows=estimateFps(p.category==='laptops'?fromLaptop(p):fromReadyPC(p),'FHD');
 const row=rows?.find(r=>r.id===game);return row?(row.low+row.high)/2:null;
}});
const profiles:Record<string,RadarMetric[]>={
 mouse:[metric('dpi','Разрешение','DPI'),metric('ips','Скорость','IPS'),metric('acceleration','Ускорение','G'),metric('polling','Частота опроса','Гц'),metric('battery','Автономность','ч'),metric('weight','Вес','г',true)],
 cpu:[metric('cores','Ядра'),metric('threads','Потоки'),metric('frequency','Базовая частота','ГГц'),metric('l3','Кэш L3','МБ'),metric('watts','Мощность','Вт',true),price],
 motherboard:[metric('ramSlots','Слоты ОЗУ'),metric('maxRam','Макс. ОЗУ','ГБ'),metric('powerPhases','Фазы питания'),metric('gpuSlots','Слоты GPU'),metric('m2Slots','Слоты M.2'),price],
 gpu:[metric('vram','Видеопамять','ГБ'),metric('bus','Шина памяти','бит'),metric('watts','Потребление','Вт',true),metric('baseClock','Базовая частота GPU','МГц'),cudaCores,metric('bandwidth','Пропускная способность','ГБ/с')],
 ram:[metric('capacity','Объём','ГБ'),metric('speed','Частота','МГц'),metric('latency','Задержка CL','',true),metric('bandwidth','Пропускная способность','ГБ/с'),metric('voltage','Напряжение','В'),price],
 ssd:[metric('capacity','Объём','ГБ'),metric('readSpeed','Чтение','МБ/с'),metric('writeSpeed','Запись','МБ/с'),metric('endurance','Ресурс','ТБ'),metric('iops','Операции','IOPS'),price],
 psu:[metric('watts','Мощность','Вт'),metric('fanSize','Вентилятор','мм'),metric('efficiency','КПД','%'),metric('noise','Шум','дБ',true),certificate,price],
 cooler:[metric('tdp','Рассеивание','Вт'),metric('radiator','Радиатор','мм'),metric('fanSize','Вентилятор','мм'),metric('height','Высота','мм',true),metric('noise','Шум','дБ',true),price],
 case:[metric('gpuLength','Длина GPU','мм'),metric('coolerHeight','Высота кулера','мм'),metric('fans','Вентиляторы'),metric('width','Ширина','мм'),metric('height','Высота','мм'),price],
 monitor:[metric('refresh','Обновление','Гц'),metric('response','Отклик','мс',true),metric('diagonal','Диагональ','″'),metric('brightness','Яркость','нит'),metric('contrast','Контраст'),price],
 keyboard:[metric('polling','Частота опроса','Гц'),metric('battery','Автономность','ч'),metric('batteryCapacity','Батарея','мА·ч'),metric('weight','Вес','г',true),metric('switchLife','Ресурс','млн'),price],
 headphones:[metric('battery','Автономность','ч'),metric('driver','Драйвер','мм'),metric('impedance','Сопротивление','Ом'),metric('weight','Вес','г',true),metric('sensitivity','Чувствительность','дБ'),price],
 mousepad:[metric('width','Ширина','мм'),metric('depth','Глубина','мм'),metric('thickness','Толщина','мм'),metric('weight','Вес','г'),metric('warranty','Гарантия','мес.'),price],
 microphone:[metric('sampleRate','Дискретизация','кГц'),metric('bitDepth','Разрядность','бит'),metric('snr','Сигнал / шум','дБ'),metric('maxSpl','Макс. SPL','дБ'),metric('weight','Вес','г'),price],
 mount:[metric('screens','Экраны'),metric('load','Нагрузка','кг'),metric('maxDiagonal','Диагональ','″'),metric('reach','Вылет','мм'),metric('weight','Вес','кг'),price],
 webcam:[metric('fps','Частота кадров','FPS'),metric('angle','Угол обзора','°'),metric('megapixels','Разрешение','Мп'),metric('weight','Вес','г'),metric('cableLength','Кабель','м'),price],
 furniture:[metric('load','Нагрузка','кг'),metric('width','Ширина','см'),metric('height','Высота','см'),metric('depth','Глубина','см'),metric('weight','Вес','кг'),price],
 pc:[fps('cs2','CS2 · FHD'),fps('pubg','PUBG · FHD'),fps('cyberpunk','Cyberpunk · FHD'),fps('rust','Rust · FHD'),fps('valorant','Valorant · FHD'),price],
 laptops:[fps('cs2','CS2 · FHD'),fps('cyberpunk','Cyberpunk · FHD'),metric('capacity','ОЗУ','ГБ'),metric('driveCapacity','Накопитель','ГБ'),metric('refresh','Экран','Гц'),price]
};
export function comparisonMetrics(category:string):RadarMetric[]{return profiles[category]||[metric('capacity','Объём'),metric('speed','Скорость'),metric('weight','Вес','г'),metric('width','Ширина','мм'),metric('height','Высота','мм'),price]}
// Each axis is relative to this pair, not an invented benchmark out of 100.
// Missing data never becomes zero and is never joined into a filled polygon.
export function relativeValues(a:number|null,b:number|null,lowerBetter=false):[number|null,number|null]{
 if(a===null||b===null)return [a===null?null:1,b===null?null:1];
 if(a===b)return [1,1];
 if(lowerBetter){const min=Math.min(a,b);return [a===0?1:min/a,b===0?1:min/b]}
 const max=Math.max(a,b);return [a/max,b/max];
}
