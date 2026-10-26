import type {Product,BrandDefinition} from './seed';

export const popularBrands=['ASUS','MSI','GIGABYTE','ASRock','PALIT','Intel','AMD','NVIDIA','Logitech','AULA','XPG','DeepCool','Kingston','Samsung'];
export const categoryBrands:Record<string,string[]>={
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
/** The editable catalog can override the legacy list without changing old product records. */
export function defaultBrandCatalog(products:readonly Product[]=[]):BrandDefinition[]{
 const names=new Set<string>();
 Object.values(categoryBrands).flat().forEach(name=>names.add(name));
 Object.keys(brandSeries).forEach(name=>names.add(name));
 const byName=new Map<string,BrandDefinition>(),ids=new Set<string>();
 function add(name:string){
  const key=name.toLocaleLowerCase('ru');
  const found=byName.get(key);
  if(found)return found;
  const slug=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'custom';
  let id='brand-'+slug,index=2;
  while(ids.has(id)){id='brand-'+slug+'-'+index++}
  ids.add(id);
  const entry={id,name,logo:'',categories:{} as Record<string,string[]>};
  byName.set(key,entry);
  return entry;
 }
 for(const name of names){
  const entry=add(name);
  for(const [category,allowed] of Object.entries(categoryBrands)){
   if(allowed.includes(name))entry.categories[category]=[...(brandSeries[name]?.[category]||[])];
  }
 }
 // Include the owner's custom and legacy product brands when first adopting the editor.
 for(const product of products){
  const name=canonicalBrand(product.brand||'');
  if(!name||!Object.hasOwn(categoryBrands,product.category))continue;
  const entry=add(name);
  const series=product.specs?.brandSeries?.trim();
  entry.categories[product.category]??=[];
  if(series&&!entry.categories[product.category].includes(series))entry.categories[product.category].push(series);
 }
 return [...byName.values()];
}
export function gpuBrandsForChip(chip:GpuChipBrand|'',catalog?:readonly BrandDefinition[]):string[]{
 if(!catalog)return chip?[...gpuManufacturers[chip]]:brandsForCategory('gpu');
 const allowed=brandsForCategory('gpu',[],catalog);
 if(!chip)return allowed;
 // Respect the chip designer/maker distinction for the built-in GPU manufacturers.
 const known=new Set(categoryBrands.gpu);
 return allowed.filter(name=>!known.has(name)||gpuManufacturers[chip].includes(name));
}
export function brandsForCategory(category:string,products:readonly Product[]=[],catalog?:readonly BrandDefinition[]):string[]{
 if(catalog){
  const names=catalog.filter(brand=>Object.hasOwn(brand.categories,category)).map(brand=>brand.name);
  // Existing goods must remain editable if their manufacturer was removed from a category.
  const existing=products.filter(p=>p.category===category).map(p=>canonicalBrand(p.brand));
  return [...new Set([...names,...existing])];
 }
 const allowed=categoryBrands[category]||[];
 if(category==='cpu'||category==='gpu')return [...allowed];
 const existing=products.filter(p=>p.category===category).map(p=>canonicalBrand(p.brand))
  .filter(b=>b&&(!popularBrands.includes(b)||allowed.includes(b)));
 return [...new Set([...allowed,...existing])];
}
export function selectedBrand(product:Product,products:readonly Product[],catalog?:readonly BrandDefinition[]):string{
 const brand=canonicalBrand(product.brand);
 const options=product.category==='gpu'?gpuBrandsForChip(gpuChipBrand(product),catalog):brandsForCategory(product.category,products,catalog);
 return options.includes(brand)?brand:'';
}

export const brandSeries:Record<string,Record<string,string[]>>={
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
export function seriesForBrand(brand:string,category:string,catalog?:readonly BrandDefinition[]):string[]{
 if(catalog){
  const entry=catalog.find(entry=>entry.name.toLowerCase()===canonicalBrand(brand).toLowerCase());
  return entry?.categories[category]||[];
 }
 return brandSeries[canonicalBrand(brand)]?.[category]||[];
}
export function selectedSeries(product:Product,catalog?:readonly BrandDefinition[]):string{
 const stored=product.specs?.brandSeries?.trim()||'';
 const options=seriesForBrand(product.brand,product.category,catalog);
 if(product.specs?.brandSeries!==undefined)return options.includes(stored)?stored:'';
 return /^asus\s+rog$/i.test(product.brand.trim())&&options.includes('ROG')?'ROG':'';
}
