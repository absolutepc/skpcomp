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
/** SSD and HDD details share the storage category. Leave unpublished specs empty. */
export const ssdFieldGroups:{title:string;fields:Field[]}[]=[
 {title:'Тип, форм-фактор и подключение',fields:[
  f('driveType','Тип накопителя'),f('capacity','Объём','ГБ'),
  f('form','Форм-фактор'),f('interface','Интерфейс'),f('protocol','Протокол передачи данных'),
  f('pcieVersion','Версия PCIe'),f('pcieLanes','Количество линий PCIe','шт.')
 ]},
 {title:'Контроллер и память',fields:[
  f('controller','Контроллер'),f('nandType','Тип NAND-памяти (TLC / QLC / MLC / SLC)'),
  f('nandLayers','Количество слоёв NAND','шт.'),f('nandManufacturer','Производитель NAND-памяти')
 ]},
 {title:'Кэширование',fields:[
  f('dramCache','Объём оперативного DRAM-кэша','МБ'),
  f('dramType','Тип DRAM-кэша'),f('hmb','Поддержка Host Memory Buffer (HMB)'),
  f('pslcCache','pSLC-кэш (наличие / тип)'),
  f('pslcCacheSize','Максимальный объём pSLC-кэша','ГБ')
 ]},
 {title:'Скорость работы',fields:[
  f('readSpeed','Скорость последовательного чтения','МБ/с'),
  f('writeSpeed','Скорость последовательной записи','МБ/с'),
  f('iops','Случайное чтение 4K','IOPS'),
  f('writeIops','Случайная запись 4K','IOPS'),
  f('postCacheWriteSpeed','Скорость записи после исчерпания кэша','МБ/с')
 ]},
 {title:'Ресурс, возможности и характеристики',fields:[
  f('endurance','Ресурс TBW','ТБ'),f('dwpd','Ресурс DWPD','раз/день'),
  f('mtbf','Среднее время наработки на отказ (MTBF)','ч'),
  f('warranty','Гарантия','мес.'),
  f('trim','Поддержка TRIM'),f('smart','Поддержка S.M.A.R.T.'),
  f('encryption','Аппаратное шифрование'),f('heatsink','Радиатор охлаждения'),
  f('power','Энергопотребление','Вт'),f('workingTemp','Рабочая температура'),
  f('weight','Вес','г')
 ]},
 {title:'Дополнительно для HDD',fields:[
  f('rpm','Скорость вращения шпинделя','об/мин'),
  f('bufferCache','Буфер HDD','МБ'),
  f('recordingTechnology','Технология магнитной записи (CMR / SMR)')
 ]}
];
/** PSU specs: use real manufacturer data, never assume certifications or protections. */
export const psuFieldGroups:{title:string;fields:Field[]}[]=[
 {title:'Основные параметры и стандарты',fields:[
  f('watts','Номинальная мощность','Вт'),
  f('peakWatts','Пиковая мощность','Вт'),
  f('form','Форм-фактор'),
  f('standard','Стандарт ATX (версия)'),
  f('pcieStandard','Стандарт PCIe (версия)'),
  f('modular','Модульность кабелей'),
  f('recommendedBuild','Рекомендуемая конфигурация / назначение')
 ]},
 {title:'Эффективность и схемотехника',fields:[
  f('certificate','Сертификат 80 PLUS'),
  f('cybeneticsEta','Сертификат Cybenetics ETA'),
  f('cybeneticsLambda','Сертификат Cybenetics LAMBDA'),
  f('efficiency','КПД','%'),
  f('pfc','Коррекция коэффициента мощности (PFC)'),
  f('topology','Топология преобразователя'),
  f('dcDc','DC-DC преобразователи'),
  f('capacitors','Тип / производитель конденсаторов')
 ]},
 {title:'Электрические характеристики',fields:[
  f('inputVoltage','Входное напряжение сети'),
  f('inputFrequency','Частота сети','Гц'),
  f('inputCurrent','Входной ток','А'),
  f('rail12vCurrent','Ток по линии +12 В','А'),
  f('rail12vPower','Мощность по линии +12 В','Вт'),
  f('rail5vCurrent','Ток по линии +5 В','А'),
  f('rail33vCurrent','Ток по линии +3,3 В','А'),
  f('rail5vsbCurrent','Ток по линии +5VSB','А'),
  f('holdUpTime','Время удержания питания (Hold-up time)','мс'),
  f('ripple12v','Пульсации по линии +12 В','мВ')
 ]},
 {title:'Разъёмы и кабели',fields:[
  f('atx24pin','Разъёмы питания материнской платы 20+4 pin','шт.'),
  f('eps8pin','Разъёмы CPU EPS 4+4 / 8 pin','шт.'),
  f('eps4pin','Разъёмы CPU 4 pin','шт.'),
  f('pcie62pin','Разъёмы видеокарт PCIe 6+2 pin','шт.'),
  f('pcie6pin','Разъёмы видеокарт PCIe 6 pin','шт.'),
  f('gpu16pin','Разъёмы питания видеокарт 12V-2x6 / 12VHPWR','шт.'),
  f('gpu16pinType','Тип 16-контактного разъёма (12V-2x6 / 12VHPWR)'),
  f('gpu16pinPower','Максимальная мощность 16-контактного разъёма','Вт'),
  f('sataPower','Разъёмы питания SATA','шт.'),
  f('molexPower','Разъёмы Molex 4 pin','шт.'),
  f('floppyPower','Разъёмы Floppy 4 pin','шт.'),
  f('cableType','Тип кабелей / оплётка'),
  f('atxCableLength','Длина кабеля 24 pin','мм'),
  f('epsCableLength','Длина кабеля CPU EPS','мм'),
  f('gpuCableLength','Длина кабеля питания видеокарты','мм')
 ]},
 {title:'Охлаждение и акустика',fields:[
  f('fanSize','Диаметр вентилятора','мм'),
  f('fanBearing','Тип подшипника вентилятора'),
  f('fanSpeed','Максимальная скорость вентилятора','об/мин'),
  f('semiPassive','Полупассивный режим (Zero RPM)'),
  f('fanControl','Управление скоростью вентилятора'),
  f('noise','Уровень шума','дБ'),
  f('rgb','Подсветка')
 ]},
 {title:'Защиты, надёжность и габариты',fields:[
  f('protections','Защиты (OVP / UVP / OCP / OPP / SCP / OTP / SIP)'),
  f('mtbf','Наработка на отказ (MTBF)','ч'),
  f('operatingTemp','Диапазон рабочих температур'),
  f('width','Ширина','мм'),f('height','Высота','мм'),f('length','Глубина','мм'),
  f('weight','Вес','г'),f('warranty','Гарантия','мес.')
 ]}
];
/** Full PC-case specifications. Existing seven case keys stay unchanged. */
export const caseFieldGroups:{title:string;fields:Field[]}[]=[
 {title:'Конструкция и внешний вид',fields:[
  f('form','Тип корпуса'),
  f('boardForm','Форм-фактор платы'),
  f('color','Цвет'),
  f('side','Боковая панель'),
  f('frontPanel','Передняя панель'),
  f('topPanel','Верхняя панель'),
  f('chassisMaterial','Материал шасси'),
  f('panelMaterial','Материал панелей'),
  f('glassThickness','Толщина стекла','мм'),
  f('sideOpening','Способ открытия боковой панели')
 ]},
 {title:'Габариты и совместимость',fields:[
  f('width','Ширина корпуса','мм'),
  f('height','Высота корпуса','мм'),
  f('depth','Глубина корпуса','мм'),
  f('weight','Вес корпуса','кг'),
  f('gpuLength','Максимальная длина GPU','мм'),
  f('gpuThicknessSlots','Максимальная толщина GPU','слотов'),
  f('coolerHeight','Максимальная высота кулера CPU','мм'),
  f('psuLength','Максимальная длина блока питания','мм'),
  f('psuForm','Поддерживаемые форм-факторы БП'),
  f('psuPosition','Расположение блока питания'),
  f('expansionSlots','Горизонтальные слоты расширения','шт.'),
  f('verticalGpuSlots','Вертикальные слоты для GPU','шт.'),
  f('verticalGpuMount','Вертикальная установка видеокарты'),
  f('riserIncluded','Райзер PCIe в комплекте'),
  f('backConnect','Поддержка плат с обратными разъёмами (BTF / Project Zero)'),
  f('cableClearance','Место для кабелей за платой','мм'),
  f('drive35','Места для накопителей 3,5″','шт.'),
  f('drive25','Места для накопителей 2,5″','шт.'),
  f('drive525','Отсеки 5,25″','шт.')
 ]},
 {title:'Вентиляторы и воздушный поток',fields:[
  f('fans','Вентиляторы в комплекте','шт.'),
  f('includedFanSizes','Размеры и расположение комплектных вентиляторов'),
  f('fanSlots','Всего мест под вентиляторы','шт.'),
  f('frontFans','Передние вентиляторы (например, 3×120 / 2×140)'),
  f('topFans','Верхние вентиляторы'),
  f('rearFans','Задние вентиляторы'),
  f('bottomFans','Нижние вентиляторы'),
  f('sideFans','Боковые вентиляторы'),
  f('fanController','Встроенный контроллер вентиляторов'),
  f('fanHub','Хаб для вентиляторов'),
  f('airflow','Особенности воздушного потока'),
  f('dustFilters','Пылевые фильтры и их расположение')
 ]},
 {title:'Совместимость с жидкостным охлаждением',fields:[
  f('frontRadiator','Поддержка радиаторов спереди'),
  f('topRadiator','Поддержка радиаторов сверху'),
  f('rearRadiator','Поддержка радиаторов сзади'),
  f('bottomRadiator','Поддержка радиаторов снизу'),
  f('sideRadiator','Поддержка радиаторов сбоку'),
  f('radiatorThickness','Допустимая толщина радиатора','мм'),
  f('pumpMount','Крепление помпы СЖО'),
  f('reservoirMount','Крепление резервуара СЖО')
 ]},
 {title:'Передняя панель и интерфейсы',fields:[
  f('frontUsbA','Порты USB-A','шт.'),
  f('frontUsbAVersion','Версии портов USB-A'),
  f('frontUsbC','Порты USB-C','шт.'),
  f('frontUsbCVersion','Версии портов USB-C'),
  f('headphoneJack','Аудиоразъём для наушников'),
  f('microphoneJack','Разъём микрофона'),
  f('frontPanelPosition','Расположение панели I/O'),
  f('resetButton','Кнопка Reset'),
  f('ledButton','Кнопка управления подсветкой')
 ]},
 {title:'Подсветка, удобство сборки и комплектация',fields:[
  f('rgb','Подсветка'),
  f('rgbController','Контроллер RGB / ARGB'),
  f('rgbSync','Синхронизация ARGB с материнской платой'),
  f('gpuSupport','Подпорка видеокарты в комплекте'),
  f('toolFree','Безинструментальная сборка'),
  f('cableManagement','Система кабель-менеджмента'),
  f('soundInsulation','Шумоизоляция'),
  f('includedAccessories','Аксессуары в комплекте'),
  f('warranty','Гарантия','мес.')
 ]}
];
/** Detailed monitor specifications. Existing keys stay stable for saved products. */
export const monitorFieldGroups:{title:string;fields:Field[]}[]=[
 {title:'Экран и матрица',fields:[
  f('diagonal','Диагональ экрана','дюйм'),
  f('resolution','Разрешение'),
  f('aspectRatio','Соотношение сторон'),
  f('panel','Тип матрицы (IPS / VA / TN / OLED / WOLED / QD-OLED)'),
  f('panelGeneration','Поколение / технология матрицы'),
  f('panelManufacturer','Производитель матрицы'),
  f('pixelPitch','Шаг пикселя','мм'),
  f('ppi','Плотность пикселей','PPI'),
  f('curved','Изогнутый экран'),
  f('curvature','Радиус кривизны','R'),
  f('surface','Поверхность экрана (матовая / глянцевая)'),
  f('antiGlare','Антибликовое покрытие'),
  f('viewingAngle','Углы обзора'),
  f('frameless','Безрамочная конструкция')
 ]},
 {title:'Частота обновления и игровые возможности',fields:[
  f('refresh','Максимальная частота обновления','Гц'),
  f('response','Время отклика (заявленное)','мс'),
  f('responseGtG','Время отклика GtG','мс'),
  f('responseMprt','Время отклика MPRT','мс'),
  f('inputLag','Задержка ввода','мс'),
  f('dualMode','Режимы экрана (Dual-Mode)'),
  f('dualModeRefresh','Частоты и разрешения в Dual-Mode'),
  f('gSync','Адаптивная синхронизация (G-SYNC / FreeSync)'),
  f('freeSyncTier','Уровень AMD FreeSync'),
  f('vrrRange','Диапазон VRR'),
  f('motionBlurReduction','Снижение размытия движения / стробирование'),
  f('overdrive','Настройка Overdrive'),
  f('gamingFeatures','Игровые функции (прицел / счётчик FPS / Shadow Boost)')
 ]},
 {title:'Яркость, контрастность и HDR',fields:[
  f('brightness','Типичная яркость SDR','нит'),
  f('peakBrightness','Пиковая яркость SDR','нит'),
  f('contrast','Статическая контрастность (:1)'),
  f('dynamicContrast','Динамическая контрастность'),
  f('hdr','Поддержка HDR / сертификат DisplayHDR'),
  f('hdrBrightness','Пиковая яркость HDR','нит'),
  f('hdrFullScreenBrightness','Яркость HDR на всём экране','нит'),
  f('localDimming','Технология локального затемнения'),
  f('dimmingZones','Количество зон локального затемнения','шт.'),
  f('blackLevel','Уровень чёрного'),
  f('hdrFormats','Форматы HDR (HDR10 / HLG / Dolby Vision)')
 ]},
 {title:'Цветопередача и качество изображения',fields:[
  f('colorDepth','Глубина цвета'),
  f('colorCount','Количество отображаемых цветов'),
  f('srgbCoverage','Охват sRGB','%'),
  f('dciP3Coverage','Охват DCI-P3','%'),
  f('adobeRgbCoverage','Охват Adobe RGB','%'),
  f('rec2020Coverage','Охват Rec.2020','%'),
  f('colorAccuracy','Точность цветопередачи (Delta E)'),
  f('factoryCalibration','Заводская калибровка'),
  f('gamma','Гамма'),
  f('colorTemperature','Цветовая температура'),
  f('uniformityCompensation','Компенсация неравномерности подсветки'),
  f('oledCare','Защита OLED / OLED Care')
 ]},
 {title:'Разъёмы и дополнительные функции',fields:[
  f('ports','Разъёмы (общее описание)'),
  f('hdmiPorts','Количество HDMI','шт.'),
  f('hdmiVersion','Версия HDMI'),
  f('displayPortPorts','Количество DisplayPort','шт.'),
  f('displayPortVersion','Версия DisplayPort'),
  f('usbCPorts','Количество USB-C','шт.'),
  f('usbCAltMode','Видео через USB-C (DisplayPort Alt Mode)'),
  f('usbCPowerDelivery','Питание USB-C Power Delivery','Вт'),
  f('usbAPorts','Количество USB-A','шт.'),
  f('usbHub','USB-хаб'),
  f('kvm','Встроенный KVM-переключатель'),
  f('pipPbp','Режимы PiP / PbP'),
  f('audioOut','Выход 3,5 мм / аудиовыход'),
  f('speakers','Встроенные динамики'),
  f('speakerPower','Мощность динамиков','Вт'),
  f('webcam','Встроенная веб-камера')
 ]},
 {title:'Эргономика и защита зрения',fields:[
  f('vesa','Крепление VESA'),
  f('heightAdjustment','Регулировка по высоте','мм'),
  f('tilt','Наклон экрана'),
  f('swivel','Поворот влево / вправо'),
  f('pivot','Поворот в портретный режим (Pivot)'),
  f('flickerFree','Отсутствие мерцания (Flicker-Free)'),
  f('lowBlueLight','Снижение синего света'),
  f('ambientLightSensor','Датчик освещённости'),
  f('rgb','Подсветка корпуса')
 ]},
 {title:'Питание, размеры и комплектация',fields:[
  f('powerConsumption','Типичное энергопотребление','Вт'),
  f('maxPowerConsumption','Максимальное энергопотребление','Вт'),
  f('standbyPower','Энергопотребление в ожидании','Вт'),
  f('powerSupply','Блок питания (встроенный / внешний)'),
  f('width','Ширина с подставкой','мм'),
  f('height','Высота с подставкой','мм'),
  f('depth','Глубина с подставкой','мм'),
  f('weight','Вес с подставкой','кг'),
  f('weightWithoutStand','Вес без подставки','кг'),
  f('color','Цвет корпуса'),
  f('warranty','Гарантия','мес.'),
  f('includedCables','Кабели и комплект поставки')
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
 ram:[f('memory','Тип памяти'),f('capacity','Общий объём','ГБ'),f('modules','Количество модулей','шт.'),f('speed','Частота','МГц'),f('bandwidth','Пропускная способность','ГБ/с'),f('voltage','Напряжение','В'),f('latency','Тайминги CL'),f('form','Форм-фактор'),f('rgb','Подсветка')],
 ssd:ssdFieldGroups.flatMap(group=>group.fields),
 psu:psuFieldGroups.flatMap(group=>group.fields),
 cooler:[f('coolingType','Тип охлаждения'),f('socket','Поддерживаемые сокеты'),f('tdp','Рассеиваемая мощность','Вт'),f('height','Высота','мм'),f('radiator','Размер радиатора','мм'),f('fanSize','Размер вентилятора','мм'),f('rgb','Подсветка')],
 case:caseFieldGroups.flatMap(group=>group.fields),
 monitor:monitorFieldGroups.flatMap(group=>group.fields),
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
/** RAM bandwidth can be entered in MB/s; all product and comparison views show GB/s.
 * Existing bandwidth values are already in GB/s, so only the new MB/s key is converted.
 * 1 GB/s = 1000 MB/s (decimal units used for memory transfer rates).
 */
export function ramBandwidthGBps(product:Product):string{
 const raw=product.specs?.bandwidthMBps;
 if(raw===undefined)return product.specs?.bandwidth||'';
 if(!raw.trim())return '';
 const numeric=raw.trim().replace(',','.');
 if(!/^\d+(?:\.\d+)?$/.test(numeric))return '';
 const mbps=Number(numeric);
 return Number.isFinite(mbps)&&mbps>=0?String(Number((mbps/1000).toFixed(6))):'';
}
export function fieldValue(p:Product,key:string):string{
 if(p.category==='ram'&&key==='bandwidth')return ramBandwidthGBps(p);
 const explicit=p.specs?.[key];
 if(explicit!==undefined)return explicit;
 return ['socket','memory','brand'].includes(key)?String(p[key as 'socket'|'memory'|'brand']||''):key==='watts'&&p.watts?String(p.watts):'';
}
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
