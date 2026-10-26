import type {Product} from './seed';

export const popularBrands=['ASUS','MSI','GIGABYTE','ASRock','PALIT','Intel','AMD','NVIDIA','Logitech','AULA','XPG','DeepCool','Kingston','Samsung'];
const categoryBrands:Record<string,string[]>={
 cpu:['AMD','Intel'],
 gpu:['ASUS','MSI','GIGABYTE','ASRock','PALIT','ZOTAC','PNY','Gainward','INNO3D','Sapphire','PowerColor','XFX','SPARKLE','GUNNIR','NVIDIA','AMD','Intel'],
 motherboard:['ASUS','MSI','GIGABYTE','ASRock'],
 ram:['XPG','Kingston','GIGABYTE'],
 ssd:['Kingston','XPG','GIGABYTE','MSI','Samsung'],
 psu:['ASUS','MSI','GIGABYTE','XPG','DeepCool'],
 cooler:['ASUS','MSI','GIGABYTE','XPG','DeepCool'],
 case:['ASUS','MSI','GIGABYTE','XPG','DeepCool'],
 monitor:['ASUS','MSI','GIGABYTE','ASRock'],
 laptops:['ASUS','MSI','GIGABYTE','XPG'],
 mouse:['ASUS','MSI','GIGABYTE','Logitech','AULA','XPG','DeepCool'],
 keyboard:['ASUS','MSI','GIGABYTE','Logitech','AULA','XPG','DeepCool'],
 headphones:['ASUS','MSI','Logitech','AULA','XPG'],
 mousepad:['ASUS','MSI','GIGABYTE','Logitech','AULA','XPG','DeepCool'],
 microphone:['ASUS','Logitech'],webcam:['ASUS','Logitech'],
 mount:[],furniture:[],pc:['SKP','ASUS','MSI','GIGABYTE']
};
export function canonicalBrand(brand:string):string{
 const value=brand.trim();
 if(/^asus(?:\s+rog)?$/i.test(value))return 'ASUS';
 if(/^(?:geforce|nvidia(?:\s+geforce)?)$/i.test(value))return 'NVIDIA';
 return popularBrands.find(b=>b.toLowerCase()===value.toLowerCase())||value;
}
export const gpuChipBrands=['NVIDIA','AMD','Intel'] as const;
export type GpuChipBrand=typeof gpuChipBrands[number];
const gpuManufacturers:Record<GpuChipBrand,string[]>={
 NVIDIA:['ASUS','MSI','GIGABYTE','PALIT','ZOTAC','PNY','Gainward','INNO3D','NVIDIA'],
 AMD:['ASUS','MSI','GIGABYTE','ASRock','Sapphire','PowerColor','XFX','AMD'],
 Intel:['ASRock','SPARKLE','GUNNIR','Intel']
};
/** The GPU designer is different from the graphics-card board manufacturer. */
export function gpuChipBrand(product:Pick<Product,'name'|'brand'|'specs'>):GpuChipBrand|''{
 const explicit=product.specs?.gpuChipBrand?.trim().toUpperCase();
 if(explicit&&gpuChipBrands.some(x=>x===explicit))return explicit as GpuChipBrand;
 const identity=[product.name,product.specs?.gpu||'',product.brand].join(' ');
 if(/\b(?:geforce|nvidia|rtx\s*\d|gtx\s*\d)\b/i.test(identity))return 'NVIDIA';
 if(/\b(?:radeon|amd|rx\s*\d{3,4})\b/i.test(identity))return 'AMD';
 if(/\b(?:intel|arc\s*[ab]\d{3})\b/i.test(identity))return 'Intel';
 return '';
}
export function gpuBrandsForChip(chip:GpuChipBrand|''):string[]{
 return chip?[...gpuManufacturers[chip]]:brandsForCategory('gpu');
}
export function brandsForCategory(category:string,products:readonly Product[]=[]):string[]{
 const allowed=categoryBrands[category]||[];
 if(category==='cpu'||category==='gpu')return [...allowed];
 // Preserve other existing manufacturers only in their own catalogue category.
 const existing=products.filter(p=>p.category===category).map(p=>canonicalBrand(p.brand))
  .filter(b=>b&&(!popularBrands.includes(b)||allowed.includes(b)));
 return [...new Set([...allowed,...existing])];
}
export function selectedBrand(product:Product,products:readonly Product[]):string{
 const brand=canonicalBrand(product.brand);
 const options=product.category==='gpu'?gpuBrandsForChip(gpuChipBrand(product)):brandsForCategory(product.category,products);
 return options.includes(brand)?brand:'';
}

const brandSeries:Record<string,Record<string,string[]>>={
 ASUS:{gpu:['ROG Strix','ROG Astral','TUF Gaming','Dual','PRIME','ProArt'],motherboard:['ROG','TUF Gaming','PRIME','ProArt'],monitor:['ROG','TUF Gaming','ProArt','ZenScreen'],laptops:['ROG','TUF Gaming','ProArt','Zenbook','Vivobook','ExpertBook'],psu:['ROG','TUF Gaming','PRIME'],cooler:['ROG','ROG RYUJIN','ROG RYUO','ROG STRIX LC','TUF Gaming','TUF Gaming LC','PRIME','PRIME LC','ProArt'],case:['ROG','TUF Gaming','PRIME','ProArt'],mouse:['ROG','TUF Gaming'],keyboard:['ROG','TUF Gaming'],headphones:['ROG','TUF Gaming'],mousepad:['ROG','TUF Gaming'],microphone:['ROG'],webcam:['ROG'],pc:['ROG','ExpertCenter']},
 MSI:{gpu:['SUPRIM','GAMING','VENTUS','VANGUARD','SHADOW','INSPIRE'],motherboard:['MAG','MEG','MPG','PRO'],monitor:['MAG','MEG','MPG','PRO','Modern'],psu:['MAG','MEG','MPG'],cooler:['MAG','MAG CORELIQUID','MEG','MEG CORELIQUID','MPG','MPG CORELIQUID'],case:['MAG','MEG','MPG'],ssd:['SPATIUM'],laptops:['Titan','Raider','Vector','Stealth','Katana','Sword','Cyborg','Thin','Prestige','Modern','Creator','Summit'],mouse:['CLUTCH'],keyboard:['VIGOR'],headphones:['IMMERSE'],mousepad:['AGILITY'],pc:['MEG','MPG','MAG','PRO']},
 GIGABYTE:{gpu:['AORUS','AERO','GAMING','EAGLE','WINDFORCE'],motherboard:['AORUS','AERO','UD'],monitor:['AORUS'],laptops:['AORUS','AERO','GAMING'],ram:['AORUS'],ssd:['AORUS','UD'],psu:['AORUS','UD'],cooler:['AORUS','AORUS WATERFORCE'],case:['AORUS'],mouse:['AORUS'],keyboard:['AORUS'],mousepad:['AORUS'],pc:['AORUS']},
 ASRock:{gpu:['Taichi','Phantom Gaming','Steel Legend','Challenger','Creator'],motherboard:['Taichi','Phantom Gaming','Steel Legend','LiveMixer','Pro','Challenger'],monitor:['Phantom Gaming','Challenger']},
 PALIT:{gpu:['GameRock','GamingPro','JetStream','Infinity 3','Dual','White','StormX']},
 ZOTAC:{gpu:['AMP','Trinity','Solid','Twin Edge']},
 PNY:{gpu:['XLR8','VERTO']},
 Gainward:{gpu:['Phantom','Phoenix','Ghost','Pegasus']},
 INNO3D:{gpu:['iCHILL','X3','TWIN X2']},
 Sapphire:{gpu:['NITRO+','PULSE','PURE']},
 PowerColor:{gpu:['Red Devil','Hellhound','Fighter']},
 XFX:{gpu:['MERC','QICK','SWFT']},
 SPARKLE:{gpu:['TITAN','ORC','ELF']},
 GUNNIR:{gpu:['Photon','Flux','Index']},
 Intel:{cpu:['Core','Core Ultra','Xeon','Pentium','Celeron'],gpu:['Arc']},
 AMD:{cpu:['Ryzen','Ryzen Threadripper','EPYC','Athlon'],gpu:['Radeon','Radeon PRO']},
 NVIDIA:{gpu:['GeForce','RTX PRO','Quadro']},
 Logitech:{mouse:['G','PRO','MX','Signature','Pebble'],keyboard:['G','PRO','MX','Signature','Pebble'],headphones:['G','PRO','Zone'],mousepad:['G'],webcam:['BRIO','C','MX'],microphone:['Yeti']},
 XPG:{ram:['LANCER','SPECTRIX','GAMMIX'],ssd:['GAMMIX','SX'],psu:['CORE REACTOR','CYBERCORE','PYLON'],case:['INVADER','VALOR','STARKER'],cooler:['LEVANTE'],laptops:['XENIA']},
 DeepCool:{cooler:['AK','AG','AS','ASSASSIN','LE','LS','LT','LD','MYSTIQUE','LQ'],case:['CH','CC','CG','CL','MORPHEUS'],psu:['PN','PX','PQ','PM','PL','PF']},
 Kingston:{ram:['FURY Beast','FURY Renegade','FURY Impact','ValueRAM','Server Premier'],ssd:['FURY Renegade','KC','NV','A','DC']},
 Samsung:{ssd:['9100 PRO','990 PRO','990 EVO Plus','990 EVO','980 PRO','980','970 EVO Plus','970 EVO','870 EVO','870 QVO']}
};
export function seriesForBrand(brand:string,category:string):string[]{
 return brandSeries[canonicalBrand(brand)]?.[category]||[];
}
export function selectedSeries(product:Product):string{
 const stored=product.specs?.brandSeries?.trim()||'';
 const options=seriesForBrand(product.brand,product.category);
 if(product.specs?.brandSeries!==undefined)return options.includes(stored)?stored:'';
 // Older catalogue entries stored ASUS ROG as a single brand.
 return /^asus\s+rog$/i.test(product.brand.trim())&&options.includes('ROG')?'ROG':'';
}
