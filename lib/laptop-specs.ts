import type {Field} from './catalog';

/** Notebook specs: keys already used by FPS remain unchanged (cpu/gpu/capacity/gpuPowerWatts).
 * Specs are entered for the actual notebook SKU; no CPU or GPU model alone implies
 * a screen panel, VRAM variant, power limit, battery size or set of ports.
 */
const f=(key:string,label:string,unit?:string):Field=>({key,label,unit,numeric:!!unit});
export const laptopFieldGroups:{title:string;fields:Field[]}[]=[
 {title:'Процессор и графика',fields:[
  f('cpu','Модель процессора'),f('cpuCores','Количество ядер CPU','шт.'),
  f('cpuThreads','Количество потоков CPU','шт.'),f('cpuBoost','Макс. частота CPU','ГГц'),
  {...f('cpuPowerWatts','TDP / базовая мощность CPU','Вт'),numeric:false},f('integratedGpu','Встроенная графика'),
  f('gpu','Дискретная видеокарта'),f('gpuVram','Видеопамять','ГБ'),
  f('gpuMemoryType','Тип видеопамяти'),f('gpuPowerWatts','Мощность видеокарты (TGP с Dynamic Boost)','Вт'),
  f('muxSwitch','MUX Switch'),f('advancedOptimus','Advanced Optimus')
 ]},
 {title:'Экран и изображение',fields:[
  f('diagonal','Диагональ экрана','дюйм'),f('resolution','Разрешение экрана'),
  f('aspectRatio','Соотношение сторон'),f('panel','Тип матрицы'),
  f('refresh','Частота обновления','Гц'),f('response','Время отклика','мс'),
  f('brightness','Типичная яркость','нит'),f('colorGamut','Цветовой охват'),
  f('srgbCoverage','Охват sRGB','%'),f('dciP3Coverage','Охват DCI-P3','%'),
  f('screenSurface','Покрытие экрана'),f('touchscreen','Сенсорный экран'),
  f('hdr','HDR'),f('vrr','Адаптивная синхронизация'),f('screenRatio','Отношение экрана к корпусу','%'),
  f('webcam','Встроенная камера')
 ]},
 {title:'Оперативная память',fields:[
  f('capacity','Объём оперативной памяти','ГБ'),f('memoryType','Тип оперативной памяти'),
  f('ramSpeed','Частота оперативной памяти','МГц'),f('ramSlots','Слоты памяти','шт.'),
  f('ramSoldered','Распаянная память'),f('maxRam','Максимальный объём памяти','ГБ'),
  f('ramConfiguration','Конфигурация модулей')
 ]},
 {title:'Накопители и расширение',fields:[
  f('driveCapacity','Объём основного накопителя','ГБ'),f('driveType','Тип накопителя'),
  f('driveInterface','Интерфейс основного накопителя'),f('driveForm','Форм-фактор SSD'),
  f('extraDriveCapacity','Дополнительный накопитель','ГБ'),f('m2Slots','Слоты M.2','шт.'),
  f('m2FreeSlots','Свободные слоты M.2','шт.')
 ]},
 {title:'Подключения и порты',fields:[
  f('wifi','Wi-Fi'),f('bluetooth','Bluetooth'),f('ethernet','Ethernet (RJ-45)'),
  f('usbA','Количество USB-A','шт.'),f('usbC','Количество USB-C','шт.'),
  f('usb4','USB4'),f('thunderbolt','Thunderbolt'),
  f('hdmi','HDMI'),f('displayPort','DisplayPort / DP через USB-C'),
  f('audioJack','Аудиоразъём'),f('cardReader','Кардридер')
 ]},
 {title:'Корпус и устройства ввода',fields:[
  f('material','Материал корпуса'),f('color','Цвет корпуса'),
  f('keyboardLayout','Раскладка клавиатуры'),f('keyboardBacklight','Подсветка клавиатуры'),
  f('numpad','Цифровой блок'),f('fingerprint','Сканер отпечатка'),
  f('faceUnlock','Распознавание лица'),f('speakers','Динамики'),
  f('microphone','Микрофон'),f('weight','Вес','кг'),
  f('width','Ширина','мм'),f('depth','Глубина','мм'),f('thickness','Толщина','мм')
 ]},
 {title:'Питание и система',fields:[
  f('batteryCapacity','Ёмкость аккумулятора','Вт·ч'),f('adapterPower','Мощность адаптера','Вт'),
  f('usbCPowerDelivery','Зарядка по USB-C PD'),f('batteryLife','Заявленная автономность','ч'),
  f('operatingSystem','Операционная система'),f('warranty','Гарантия','мес.')
 ]}
];

/** Preset choices are UI shortcuts, not inferred specifications. Unknown values
 * remain editable and are preserved when editing existing products.
 */
export const laptopFieldChoices:Record<string,readonly string[]>={
 diagonal:['13.3','13.4','14','14.5','15','15.6','16','16.1','17','17.3','18'],
 refresh:['60','90','120','144','165','180','240','300','360'],
 capacity:['8','16','24','32','48','64','96','128'],
 driveCapacity:['256','512','1000','1024','2000','2048','4000','4096'],
 gpuPowerWatts:['35','45','50','60','65','75','80','90','95','100','105','115','120','125','140','150','175'],
 brightness:['250','300','350','400','500','600','1000'],
 aspectRatio:['16:9','16:10','3:2','3:4'],
 resolution:['1920 × 1080','1920 × 1200','2560 × 1440','2560 × 1600','2880 × 1800','3200 × 2000','3840 × 2160'],
 panel:['IPS','IPS-level','VA','TN','OLED','Mini-LED','QD-OLED'],
 screenSurface:['Матовая','Глянцевая','Антибликовая'],
 hdr:['Нет','HDR10','DisplayHDR 400','DisplayHDR 500','DisplayHDR 600','DisplayHDR 1000','Dolby Vision'],
 vrr:['Нет','Adaptive-Sync','G-SYNC','FreeSync','G-SYNC / Advanced Optimus'],
 touchscreen:['Да','Нет'],
 memoryType:['DDR4','DDR5','LPDDR4X','LPDDR5','LPDDR5X'],
 ramSoldered:['Да','Нет','Частично'],
 ramConfiguration:['1 × 8 ГБ','2 × 8 ГБ','1 × 16 ГБ','2 × 16 ГБ','2 × 32 ГБ'],
 gpuMemoryType:['GDDR6','GDDR7','Общая память'],
 muxSwitch:['Да','Нет'],
 advancedOptimus:['Да','Нет'],
 driveType:['SSD','HDD','SSD + HDD'],
 driveForm:['M.2 2230','M.2 2242','M.2 2280','2.5\"'],
 driveInterface:['PCIe 3.0 NVMe','PCIe 4.0 NVMe','PCIe 5.0 NVMe','SATA'],
 wifi:['Wi-Fi 5','Wi-Fi 6','Wi-Fi 6E','Wi-Fi 7'],
 bluetooth:['5.0','5.1','5.2','5.3','5.4','6.0'],
 ethernet:['Нет','1 Гбит/с','2.5 Гбит/с','5 Гбит/с'],
 usb4:['Нет','USB4 40 Гбит/с','USB4 80 Гбит/с'],
 thunderbolt:['Нет','Thunderbolt 3','Thunderbolt 4','Thunderbolt 5'],
 hdmi:['Нет','HDMI 1.4','HDMI 2.0','HDMI 2.1'],
 displayPort:['Нет','DisplayPort 1.4','DisplayPort 2.1','DP Alt Mode'],
 audioJack:['Нет','3.5 мм комбинированный','3.5 мм раздельные'],
 cardReader:['Нет','microSD','SD'],
 keyboardBacklight:['Нет','Белая','Однозонная RGB','Четырёхзонная RGB','Поклавишная RGB'],
 numpad:['Да','Нет'],
 fingerprint:['Да','Нет'],
 faceUnlock:['Да','Нет'],
 usbCPowerDelivery:['Да','Нет'],
 operatingSystem:['Без ОС','Windows 11 Home','Windows 11 Pro','Linux']
};
