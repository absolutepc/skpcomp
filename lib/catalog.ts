import {seed,Product} from './seed';
import {productPhotos} from './product-photos';
import {gpuChipBrand,type GpuChipBrand} from './product-brands';
export const components:Record<string,string>={cpu:'Процессоры',motherboard:'Мат.платы',gpu:'Видеокарты',ram:'ОЗУ',ssd:'Накопители',psu:'Блоки питания',cooler:'Охлаждение',case:'Корпуса'};
export const peripherals:Record<string,string>={monitor:'Мониторы',mouse:'Мышки',keyboard:'Клавиатуры',headphones:'Наушники',mousepad:'Коврики',microphone:'Микрофоны',mount:'Кронштейны',webcam:'Веб-камеры'};
export type Field={key:string;label:string;unit?:string;numeric?:boolean;chip?:GpuChipBrand};
const f=(key:string,label:string,unit?:string,chip?:GpuChipBrand):Field=>({key,label,unit,numeric:!!unit,...(chip?{chip}:{})});
/** GPU details are grouped for the admin editor; no invented specifications are prefilled. */
export const gpuFieldGroups:{title:string;fields:Field[]}[]=[
 {title:'Графический процессор',fields:[
  f('gpu','Графический процессор'),f('architecture','Архитектура GPU'),f('processNm','Техпроцесс','нм'),
  f('cudaCores','CUDA-ядра','шт.','NVIDIA'),
  f('streamProcessors','Потоковые процессоры','шт.','AMD'),
  f('xeCores','Xe-ядра','шт.','Intel'),
  f('rtCores','RT-ядра','шт.','NVIDIA'),
  f('rayAccelerators','Ray Accelerators','шт.','AMD'),
  f('rayTracingUnits','Блоки трассировки лучей','шт.','Intel'),
  f('tensorCores','Тензорные ядра','шт.','NVIDIA'),
  f('aiAccelerators','AI-ускорители','шт.','AMD'),
  f('xmxEngines','XMX-движки','шт.','Intel'),
  f('baseClock','Базовая частота GPU','МГц'),f('boostClock','Частота Boost GPU','МГц'),
  f('textureUnits','Текстурные блоки (TMU)','шт.'),f('rops','Блоки растеризации (ROP)','шт.')
 ]},
 {title:'Видеопамять',fields:[
  f('vram','Объём видеопамяти','ГБ'),f('videoMemory','Тип видеопамяти'),f('bus','Разрядность шины','бит'),
  f('memorySpeed','Эффективная скорость памяти','Гбит/с'),f('bandwidth','Пропускная способность памяти','ГБ/с'),
  f('l2Cache','Кэш L2','МБ')
 ]},
 {title:'Интерфейс и питание',fields:[
  f('interface','Версия PCIe'),f('pcieLanes','Линии PCIe'),
  f('watts','Энергопотребление (TBP/TGP)','Вт'),f('recommendedPsu','Рекомендуемая мощность БП','Вт'),
  f('powerConnectors','Разъёмы дополнительного питания')
 ]},
 {title:'Охлаждение и габариты',fields:[
  f('coolingType','Тип охлаждения'),f('fans','Количество вентиляторов','шт.'),
  f('length','Длина','мм'),f('width','Ширина','мм'),f('height','Высота','мм'),
  f('slots','Толщина, занятых слотов','слота'),f('weight','Вес','г'),
  f('backplate','Бэкплейт'),f('rgb','Подсветка'),f('color','Цвет')
 ]},
 {title:'Выходы и технологии',fields:[
  f('hdmiPorts','Разъёмы HDMI','шт.'),f('displayPortPorts','Разъёмы DisplayPort','шт.'),
  f('usbCPorts','Видеоразъёмы USB-C','шт.'),f('outputs','Видеовыходы / их версии'),
  f('maxDisplays','Макс. число мониторов','шт.'),f('maxResolution','Максимальное разрешение'),
  f('rayTracing','Аппаратная трассировка лучей'),
  f('dlss','DLSS',undefined,'NVIDIA'),f('fsr','FSR'),f('xess','XeSS'),
  f('videoEncoders','Кодирование видео (AV1 / H.264 / HEVC)')
 ]}
];
export function fieldsForProduct(product:Product):Field[]{
 const fields=categoryFields[product.category]||[];
 if(product.category!=='gpu')return fields;
 const chip=gpuChipBrand(product);
 return fields.filter(field=>!field.chip||field.chip===chip);
}
export const categoryFields:Record<string,Field[]>={
 cpu:[f('socket','Сокет'),f('memory','Тип памяти'),f('cores','Ядра','шт.'),f('threads','Потоки','шт.'),f('l3','Кэш L3','МБ'),f('frequency','Базовая частота','ГГц'),f('boost','Макс. частота Boost','ГГц'),f('architecture','Архитектура'),f('watts','Мощность','Вт'),f('graphics','Встроенная графика'),f('package','Комплектация')],
 motherboard:[
  f('socket','Сокет'),f('chipset','Чипсет'),f('memory','Тип памяти'),f('form','Форм-фактор'),
  f('powerPhases','Фазы питания процессора (VRM)','шт.'),
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
 gpu:gpuFieldGroups.flatMap(group=>group.fields),
 ram:[f('memory','Тип памяти'),f('capacity','Общий объём','ГБ'),f('modules','Количество модулей','шт.'),f('speed','Частота','МГц'),f('bandwidth','Пропускная способность','ГБ/с'),f('latency','Тайминги CL'),f('form','Форм-фактор'),f('rgb','Подсветка')],
 ssd:[f('driveType','Тип накопителя'),f('capacity','Объём','ГБ'),f('interface','Интерфейс'),f('form','Форм-фактор'),f('readSpeed','Скорость чтения','МБ/с'),f('writeSpeed','Скорость записи','МБ/с'),f('endurance','Ресурс TBW','ТБ')],
 psu:[f('watts','Мощность','Вт'),f('certificate','Сертификат'),f('form','Форм-фактор'),f('modular','Модульные кабели'),f('standard','Стандарт ATX'),f('fanSize','Вентилятор','мм')],
 cooler:[f('coolingType','Тип охлаждения'),f('socket','Поддерживаемые сокеты'),f('tdp','Рассеиваемая мощность','Вт'),f('height','Высота','мм'),f('radiator','Размер радиатора','мм'),f('fanSize','Размер вентилятора','мм'),f('rgb','Подсветка')],
 case:[f('form','Тип корпуса'),f('boardForm','Форм-фактор платы'),f('gpuLength','Максимальная длина GPU','мм'),f('coolerHeight','Высота кулера','мм'),f('fans','Вентиляторы в комплекте','шт.'),f('color','Цвет'),f('side','Боковая панель')],
 monitor:[f('diagonal','Диагональ','дюйм'),f('resolution','Разрешение'),f('panel','Матрица'),f('refresh','Частота обновления','Гц'),f('response','Время отклика','мс'),f('ports','Разъёмы'),f('curved','Изогнутый экран'),f('vesa','VESA'),f('dualMode','Режимы экрана'),f('hdr','HDR'),f('gSync','Адаптивная синхронизация'),f('color','Цвет')],
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
 keyboard:[f('keyboardType','Тип клавиатуры'),f('format','Формат'),f('switch','Переключатели'),f('connection','Подключение'),f('layout','Раскладка'),f('hotswap','Hot-swap'),f('rgb','Подсветка'),f('color','Цвет'),f('polling','Частота опроса','Гц'),f('display','Дисплей'),f('dimensions','Габариты')],
 headphones:[f('headphoneType','Тип наушников'),f('connection','Подключение'),f('microphone','Микрофон'),f('sound','Звук'),f('driver','Диаметр драйвера','мм'),f('battery','Автономность','ч'),f('impedance','Сопротивление','Ом'),f('noiseCancel','Шумоподавление'),f('color','Цвет')],
 mousepad:[f('material','Материал'),f('surface','Поверхность'),f('width','Ширина','мм'),f('depth','Глубина','мм'),f('thickness','Толщина','мм'),f('rgb','Подсветка'),f('color','Цвет')],
 microphone:[f('micType','Тип микрофона'),f('connection','Подключение'),f('pattern','Направленность'),f('sampleRate','Частота дискретизации','кГц'),f('bitDepth','Разрядность','бит'),f('mounting','Крепление')],
 mount:[f('mounting','Способ крепления'),f('screens','Количество экранов','шт.'),f('vesa','VESA'),f('load','Максимальная нагрузка','кг'),f('maxDiagonal','Максимальная диагональ','дюйм'),f('gasLift','Газлифт')],
 webcam:[f('resolution','Разрешение'),f('fps','Частота кадров','кадр/с'),f('focus','Фокусировка'),f('microphone','Микрофон'),f('connection','Подключение'),f('angle','Угол обзора','°'),f('privacy','Защитная шторка')],
 laptops:[f('cpu','Процессор'),f('gpu','Видеокарта'),f('capacity','ОЗУ','ГБ'),f('driveCapacity','Накопитель','ГБ'),f('diagonal','Диагональ','дюйм'),f('resolution','Разрешение'),f('refresh','Частота экрана','Гц'),f('gpuPowerWatts','Мощность GPU (TGP, включая Dynamic Boost)','Вт')],
 furniture:[f('furnitureType','Тип мебели'),f('material','Материал'),f('color','Цвет'),f('width','Ширина','см'),f('load','Максимальная нагрузка','кг')]
};
export function normalizeProduct(p:Product):Product{
 // Remove color suffix from legacy Superlight 2 titles without changing
 // the individual white/black variants or custom merchant product names.
 const name=(p.id==='mouse'||p.id==='logitech-pro-x-superlight-2-black')&&
  /^Logitech G PRO X Superlight 2\s*[—-]\s*(?:белая|чёрная)$/i.test(p.name)
  ?'Logitech G PRO X Superlight 2':p.name;
 // Keep matching the bundled specification defaults after the public name
 // is shortened, even when an older database still has a color suffix.
 const original=seed.products.find(x=>x.id===p.id&&x.name===name);
 // A shop owner's custom photo must always take precedence over bundled catalog defaults.
 // Older D1 catalogs may contain blank images or the previous schematic SVG illustrations.
 const bundledPhoto=productPhotos[p.id];
 const isLegacyIllustration=/^\/products\/(?:cpu|headphones)\/[^?#]+\.svg(?:[?#].*)?$/.test(p.image||'');
 // A defined gallery (even []) means the merchant has explicitly managed the photos.
 const image=p.category!=='mouse'&&bundledPhoto&&p.gallery===undefined&&(!p.image||isLegacyIllustration)?bundledPhoto:p.image;
 return {...p,name,image,specs:{...(original as Product|undefined)?.specs,...p.specs},category:p.category==='peripherals'&&['monitor','mouse','keyboard'].includes(p.art)?p.art:p.category};
}
export function fieldValue(p:Product,key:string):string{const explicit=p.specs?.[key];if(explicit!==undefined)return explicit;return ['socket','memory','brand'].includes(key)?String(p[key as 'socket'|'memory'|'brand']||''):key==='watts'&&p.watts?String(p.watts):''}
/** Ignore specs kept from a previous GPU platform rather than exposing CUDA on an AMD card. */
export function specValue(product:Product,field:Field):string{
 return field.chip&&gpuChipBrand(product)!==field.chip?'':fieldValue(product,field.key);
}
export const splitValues=(v:string)=>v.split(/[|;]/).map(x=>x.trim()).filter(Boolean);
export function inCategory(p:Product,category:string){const c=normalizeProduct(p).category;return category==='all'?true:category==='components'?c in components:category==='peripherals'?c in peripherals||c==='peripherals':c===category}
export type Facets=Record<string,string[]>;
export type Ranges=Record<string,{min?:string;max?:string}>;
export function matchesFilters(p:Product,facets:Facets,ranges:Ranges){
 const get=(key:string)=>{const field=categoryFields[p.category]?.find(f=>f.key===key);return field?specValue(p,field):fieldValue(p,key)};
 return Object.entries(facets).every(([key,chosen])=>!chosen.length||splitValues(get(key)).some(v=>chosen.includes(v)))&&Object.entries(ranges).every(([key,r])=>{if(!r.min&&!r.max)return true;const raw=get(key);const n=Number(raw.replace(',','.'));return raw!==''&&Number.isFinite(n)&&(!r.min||n>=Number(r.min))&&(!r.max||n<=Number(r.max))});
}
