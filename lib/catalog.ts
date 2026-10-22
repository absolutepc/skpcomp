import {seed,Product} from './seed';
import {productPhotos} from './product-photos';
export const components:Record<string,string>={cpu:'Процессоры',motherboard:'Мат.платы',gpu:'Видеокарты',ram:'ОЗУ',ssd:'Накопители',psu:'Блоки питания',cooler:'Охлаждение',case:'Корпуса'};
export const peripherals:Record<string,string>={monitor:'Мониторы',mouse:'Мышки',keyboard:'Клавиатуры',headphones:'Наушники',mousepad:'Коврики',microphone:'Микрофоны',mount:'Кронштейны',webcam:'Веб-камеры'};
export type Field={key:string;label:string;unit?:string;numeric?:boolean};
const f=(key:string,label:string,unit?:string):Field=>({key,label,unit,numeric:!!unit});
export const categoryFields:Record<string,Field[]>={
 cpu:[f('socket','Сокет'),f('memory','Тип памяти'),f('cores','Ядра','шт.'),f('threads','Потоки','шт.'),f('l3','Кэш L3','МБ'),f('frequency','Базовая частота','ГГц'),f('boost','Макс. частота Boost','ГГц'),f('architecture','Архитектура'),f('watts','Мощность','Вт'),f('graphics','Встроенная графика'),f('package','Комплектация')],
 motherboard:[
  f('socket','Сокет'),f('chipset','Чипсет'),f('memory','Тип памяти'),f('form','Форм-фактор'),
  f('ramSlots','Слоты ОЗУ','шт.'),f('maxRam','Максимум ОЗУ','ГБ'),
  f('pcieVersion','Поддерживаемые версии PCIe'),
  f('pcieSlots','Всего слотов расширения PCIe','шт.'),
  f('gpuSlots','Слоты PCIe x16 для видеокарт','шт.'),
  f('gpuPcie','Версии PCIe для видеокарт'),
  f('gpuSlotConfig','Конфигурация слотов видеокарт (версия / линии / количество)'),
  f('m2Slots','Слоты M.2','шт.'),
  f('m2Pcie','Версии PCIe для M.2 SSD'),
  f('m2SlotConfig','Конфигурация M.2 SSD (версия / линии / количество)'),
  f('wifi','Wi-Fi')
 ],
 gpu:[f('gpu','Графический процессор'),f('vram','Видеопамять','ГБ'),f('videoMemory','Тип видеопамяти'),f('bus','Шина памяти','бит'),f('interface','Интерфейс'),f('length','Длина','мм'),f('watts','Потребление','Вт')],
 ram:[f('memory','Тип памяти'),f('capacity','Общий объём','ГБ'),f('modules','Количество модулей','шт.'),f('speed','Частота','МГц'),f('latency','Тайминги CL'),f('form','Форм-фактор'),f('rgb','Подсветка')],
 ssd:[f('driveType','Тип накопителя'),f('capacity','Объём','ГБ'),f('interface','Интерфейс'),f('form','Форм-фактор'),f('readSpeed','Скорость чтения','МБ/с'),f('writeSpeed','Скорость записи','МБ/с'),f('endurance','Ресурс TBW','ТБ')],
 psu:[f('watts','Мощность','Вт'),f('certificate','Сертификат'),f('form','Форм-фактор'),f('modular','Модульные кабели'),f('standard','Стандарт ATX'),f('fanSize','Вентилятор','мм')],
 cooler:[f('coolingType','Тип охлаждения'),f('socket','Поддерживаемые сокеты'),f('tdp','Рассеиваемая мощность','Вт'),f('height','Высота','мм'),f('radiator','Размер радиатора','мм'),f('fanSize','Размер вентилятора','мм'),f('rgb','Подсветка')],
 case:[f('form','Тип корпуса'),f('boardForm','Форм-фактор платы'),f('gpuLength','Максимальная длина GPU','мм'),f('coolerHeight','Высота кулера','мм'),f('fans','Вентиляторы в комплекте','шт.'),f('color','Цвет'),f('side','Боковая панель')],
 monitor:[f('diagonal','Диагональ','дюйм'),f('resolution','Разрешение'),f('panel','Матрица'),f('refresh','Частота обновления','Гц'),f('response','Время отклика','мс'),f('ports','Разъёмы'),f('curved','Изогнутый экран'),f('vesa','VESA')],
 mouse:[
  f('connection','Подключение'),f('sensor','Сенсор'),
  f('dpi','Разрешение сенсора','DPI'),f('ips','Максимальная скорость отслеживания','IPS'),
  f('acceleration','Максимальное ускорение','G'),f('polling','Частота опроса','Гц'),
  f('batteryCapacity','Ёмкость батареи','мА·ч'),f('battery','Автономность','ч'),
  f('weight','Вес','г'),f('buttons','Кнопки','шт.'),
  f('switch','Переключатели'),f('switchLife','Ресурс переключателей','млн нажатий'),
  f('shape','Форма корпуса'),f('length','Длина','мм'),f('width','Ширина','мм'),
  f('height','Высота','мм'),f('rgb','Подсветка'),f('color','Цвет')
 ],
 keyboard:[f('keyboardType','Тип клавиатуры'),f('format','Формат'),f('switch','Переключатели'),f('connection','Подключение'),f('layout','Раскладка'),f('hotswap','Hot-swap'),f('rgb','Подсветка'),f('color','Цвет')],
 headphones:[f('headphoneType','Тип наушников'),f('connection','Подключение'),f('microphone','Микрофон'),f('sound','Звук'),f('driver','Диаметр драйвера','мм'),f('battery','Автономность','ч'),f('impedance','Сопротивление','Ом'),f('noiseCancel','Шумоподавление'),f('color','Цвет')],
 mousepad:[f('material','Материал'),f('surface','Поверхность'),f('width','Ширина','мм'),f('depth','Глубина','мм'),f('thickness','Толщина','мм'),f('rgb','Подсветка'),f('color','Цвет')],
 microphone:[f('micType','Тип микрофона'),f('connection','Подключение'),f('pattern','Направленность'),f('sampleRate','Частота дискретизации','кГц'),f('bitDepth','Разрядность','бит'),f('mounting','Крепление')],
 mount:[f('mounting','Способ крепления'),f('screens','Количество экранов','шт.'),f('vesa','VESA'),f('load','Максимальная нагрузка','кг'),f('maxDiagonal','Максимальная диагональ','дюйм'),f('gasLift','Газлифт')],
 webcam:[f('resolution','Разрешение'),f('fps','Частота кадров','кадр/с'),f('focus','Фокусировка'),f('microphone','Микрофон'),f('connection','Подключение'),f('angle','Угол обзора','°'),f('privacy','Защитная шторка')],
 laptops:[f('cpu','Процессор'),f('gpu','Видеокарта'),f('capacity','ОЗУ','ГБ'),f('driveCapacity','Накопитель','ГБ'),f('diagonal','Диагональ','дюйм'),f('resolution','Разрешение'),f('refresh','Частота экрана','Гц'),f('gpuPowerWatts','Мощность GPU (TGP, включая Dynamic Boost)','Вт')],
 furniture:[f('furnitureType','Тип мебели'),f('material','Материал'),f('color','Цвет'),f('width','Ширина','см'),f('load','Максимальная нагрузка','кг')]
};
export function normalizeProduct(p:Product):Product{
 const original=seed.products.find(x=>x.id===p.id&&x.name===p.name);
 // A shop owner's custom photo must always take precedence over bundled catalog defaults.
 // Older D1 catalogs may contain blank images or the previous schematic SVG illustrations.
 const bundledPhoto=productPhotos[p.id];
 const isLegacyIllustration=/^\/products\/(?:cpu|headphones)\/[^?#]+\.svg(?:[?#].*)?$/.test(p.image||'');
 // A defined gallery (even []) means the merchant has explicitly managed the photos.
 const image=p.category!=='mouse'&&bundledPhoto&&p.gallery===undefined&&(!p.image||isLegacyIllustration)?bundledPhoto:p.image;
 return {...p,image,specs:{...(original as Product|undefined)?.specs,...p.specs},category:p.category==='peripherals'&&['monitor','mouse','keyboard'].includes(p.art)?p.art:p.category};
}
export function fieldValue(p:Product,key:string):string{const explicit=p.specs?.[key];if(explicit!==undefined)return explicit;return ['socket','memory','brand'].includes(key)?String(p[key as 'socket'|'memory'|'brand']||''):key==='watts'&&p.watts?String(p.watts):''}
export const splitValues=(v:string)=>v.split(/[|;]/).map(x=>x.trim()).filter(Boolean);
export function inCategory(p:Product,category:string){const c=normalizeProduct(p).category;return category==='all'?true:category==='components'?c in components:category==='peripherals'?c in peripherals||c==='peripherals':c===category}
export type Facets=Record<string,string[]>;
export type Ranges=Record<string,{min?:string;max?:string}>;
export function matchesFilters(p:Product,facets:Facets,ranges:Ranges){return Object.entries(facets).every(([key,chosen])=>!chosen.length||splitValues(fieldValue(p,key)).some(v=>chosen.includes(v)))&&Object.entries(ranges).every(([key,r])=>{if(!r.min&&!r.max)return true;const raw=fieldValue(p,key);const n=Number(raw.replace(',','.'));return raw!==''&&Number.isFinite(n)&&(!r.min||n>=Number(r.min))&&(!r.max||n<=Number(r.max))})}
