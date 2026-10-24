import type {Product} from './seed';

export const popularBrands=['ASUS','MSI','GIGABYTE','ASRock','PALIT','Intel','AMD','NVIDIA','Logitech','AULA','XPG','DeepCool','Kingston'];
const categoryBrands:Record<string,string[]>={
 cpu:['AMD','Intel'],
 gpu:['NVIDIA','AMD','Intel'],
 motherboard:['ASUS','MSI','GIGABYTE','ASRock'],
 ram:['XPG','Kingston','GIGABYTE'],
 ssd:['Kingston','XPG','GIGABYTE','MSI'],
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
 return brandsForCategory(product.category,products).includes(brand)?brand:'';
}

const brandSeries:Record<string,Record<string,string[]>>={
 ASUS:{motherboard:['ROG','TUF Gaming','PRIME','ProArt'],monitor:['ROG','TUF Gaming','ProArt','ZenScreen'],laptops:['ROG','TUF Gaming','ProArt','Zenbook','Vivobook','ExpertBook'],psu:['ROG','TUF Gaming','PRIME'],cooler:['ROG','TUF Gaming','PRIME','ProArt'],case:['ROG','TUF Gaming','PRIME','ProArt'],mouse:['ROG','TUF Gaming'],keyboard:['ROG','TUF Gaming'],headphones:['ROG','TUF Gaming'],mousepad:['ROG','TUF Gaming'],microphone:['ROG'],webcam:['ROG'],pc:['ROG','ExpertCenter']},
 MSI:{motherboard:['MAG','MEG','MPG','PRO'],monitor:['MAG','MEG','MPG','PRO','Modern'],psu:['MAG','MEG','MPG'],cooler:['MAG','MEG','MPG'],case:['MAG','MEG','MPG'],ssd:['SPATIUM'],laptops:['Titan','Raider','Vector','Stealth','Katana','Sword','Cyborg','Thin','Prestige','Modern','Creator','Summit'],mouse:['CLUTCH'],keyboard:['VIGOR'],headphones:['IMMERSE'],mousepad:['AGILITY'],pc:['MEG','MPG','MAG','PRO']},
 GIGABYTE:{motherboard:['AORUS','AERO','UD'],monitor:['AORUS'],laptops:['AORUS','AERO','GAMING'],ram:['AORUS'],ssd:['AORUS','UD'],psu:['AORUS','UD'],cooler:['AORUS'],case:['AORUS'],mouse:['AORUS'],keyboard:['AORUS'],mousepad:['AORUS'],pc:['AORUS']},
 ASRock:{motherboard:['Taichi','Phantom Gaming','Steel Legend','LiveMixer','Pro','Challenger'],monitor:['Phantom Gaming','Challenger']},
 Intel:{cpu:['Core','Core Ultra','Xeon','Pentium','Celeron'],gpu:['Arc']},
 AMD:{cpu:['Ryzen','Ryzen Threadripper','EPYC','Athlon'],gpu:['Radeon','Radeon PRO']},
 NVIDIA:{gpu:['GeForce','RTX PRO','Quadro']},
 Logitech:{mouse:['G','PRO','MX','Signature','Pebble'],keyboard:['G','PRO','MX','Signature','Pebble'],headphones:['G','PRO','Zone'],mousepad:['G'],webcam:['BRIO','C','MX'],microphone:['Yeti']},
 XPG:{ram:['LANCER','SPECTRIX','GAMMIX'],ssd:['GAMMIX','SX'],psu:['CORE REACTOR','CYBERCORE','PYLON'],case:['INVADER','VALOR','STARKER'],cooler:['LEVANTE'],laptops:['XENIA']},
 DeepCool:{cooler:['AK','AG','AS','ASSASSIN','LE','LS','LT','LD'],case:['CH','CC','CG','CL','MORPHEUS'],psu:['PN','PX','PQ','PM','PL','PF']},
 Kingston:{ram:['FURY Beast','FURY Renegade','FURY Impact','ValueRAM','Server Premier'],ssd:['FURY Renegade','KC','NV','A','DC']}
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
