import type {Product} from './seed';

// Two demo builds to populate the ready-PC mobile catalog. Photos are real
// photographs of third-party assembled PCs in the stated chassis, NOT photos
// of a physically assembled SKP computer. Replace them with owned photos
// before advertising them as real SKP stock.
// White source: Skytech King 95 listing, Walmart; black source: Jimm's GtG
// Platinum 790, Jimms.fi. Chassis are Montech KING 95 and Lian Li LANCOOL 216.
export const READY_PC_DEMOS_VERSION=1;

export const readyPcDemos:Product[]=[
 {
  id:'skp-demo-aurora',name:'SKP AURORA WHITE / RTX 5070 Ti',
  category:'pc',price:219900,art:'pc',
  description:'Демо-сборка · Ryzen 7 7800X3D · RTX 5070 Ti 16 ГБ · 32 ГБ DDR5 · SSD 2 ТБ. Фото аналогичного ПК в корпусе Montech KING 95, не фактической сборки SKP.',
  image:'https://i5.walmartimages.com/seo/Skytech-Gaming-King-95-Gaming-PC-AMD-Ryzen-7-9850X3D-4-7GHz-NVIDIA-RTX-5070-Ti-16GB-VRAM-2TB-Gen4-NVMe-SSD-32GB-DDR5-RAM-5600-850W-GOLD-ATX-3-PSU-360_70b8a153-617c-4279-9cb4-af9ff904aee2.ddce2d59e86cebbfdaec7be8b13d865c.jpeg',
  gallery:[],stock:false,brand:'SKP · Демо',socket:'AM5',memory:'DDR5',watts:850,colorHex:'#F4F4F4',
  buildComponents:{
   cpu:'AMD Ryzen 7 7800X3D',gpu:'NVIDIA GeForce RTX 5070 Ti 16 ГБ',
   motherboard:'MSI B650 Gaming Plus WiFi',ram:'32 ГБ DDR5 6000 МГц (2 × 16 ГБ)',
   ssd:'SSD 2 ТБ M.2 NVMe PCIe 4.0',psu:'850 Вт, 80 PLUS Gold (ATX 3.1)',
   cooler:'СЖО 360 мм ARGB',case:'Montech KING 95 PRO White',
   fans:'6 × ARGB 120/140 мм',network:'Wi-Fi / Bluetooth',os:'Без ОС'
  },
  specs:{color:'Белый',purpose:'Игры / стриминг',demo:'Да'}
 },
 {
  id:'skp-demo-nightfall',name:'SKP NIGHTFALL / RTX 5070',
  category:'pc',price:164900,art:'pc',
  description:'Демо-сборка · Ryzen 7 7700 · RTX 5070 12 ГБ · 32 ГБ DDR5 · SSD 1 ТБ. Фото аналогичного ПК в корпусе Lian Li LANCOOL 216, не фактической сборки SKP.',
  image:'https://ic.jimms.fi/product/2/8/590821-ig800gg.jpg',
  gallery:[],stock:false,brand:'SKP · Демо',socket:'AM5',memory:'DDR5',watts:750,colorHex:'#161616',
  buildComponents:{
   cpu:'AMD Ryzen 7 7700',gpu:'NVIDIA GeForce RTX 5070 12 ГБ',
   motherboard:'MSI B650 Gaming Plus WiFi',ram:'32 ГБ DDR5 6000 МГц (2 × 16 ГБ)',
   ssd:'SSD 1 ТБ M.2 NVMe PCIe 4.0',psu:'750 Вт, 80 PLUS Gold (ATX 3.1)',
   cooler:'СЖО 360 мм ARGB',case:'Lian Li LANCOOL 216 RGB Black',
   fans:'2 × 160 мм ARGB спереди + 140 мм сзади',network:'Wi-Fi / Bluetooth',os:'Без ОС'
  },
  specs:{color:'Чёрный',purpose:'Игры / работа',demo:'Да'}
 }
];

export function upgradeReadyPcDemos<T extends {products:Product[];readyPcDemosVersion?:number}>(store:T):T{
 if((store.readyPcDemosVersion||0)>=READY_PC_DEMOS_VERSION)return store;
 const existingIds=new Set(store.products.map(p=>p.id));
 // Preserve all existing stock, prices, images and merchant-created records.
 return {...store,products:[...store.products,...readyPcDemos.filter(p=>!existingIds.has(p.id))],
  readyPcDemosVersion:READY_PC_DEMOS_VERSION};
}
