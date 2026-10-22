import type {Product} from './seed';

export type FpsResolution='FHD'|'2K'|'4K';
export type GraphicsPreset='low'|'medium'|'high'|'ultra';
export type UpscalingTechnology='native'|'dlss'|'fsr';
export type UpscalingQuality='quality'|'balanced'|'performance';
export const resolutions=['FHD','2K','4K'] as const;
export const graphicsPresets=[
 {value:'low',label:'Низкие'},
 {value:'medium',label:'Средние'},
 {value:'high',label:'Высокие'},
 {value:'ultra',label:'Ультра'}
] as const;
export const upscalingQualities=[
 {value:'quality',label:'Качество'},
 {value:'balanced',label:'Баланс'},
 {value:'performance',label:'Производительность'}
] as const;

export type FpsOptions={
 preset:GraphicsPreset;
 rayTracing:boolean;
 upscaling:UpscalingTechnology;
 upscalingQuality:UpscalingQuality;
};
export const defaultFpsOptions:FpsOptions={
 preset:'high',rayTracing:false,upscaling:'native',upscalingQuality:'quality'
};

type Feature='dlss'|'fsr';
// Approximate game profiles, NOT a table of measured benchmarks.
// Feature availability is intentionally conservative. It describes only
// features we explicitly model, not every option offered by the game.
export const gameProfiles=[
 {id:'cs2',name:'Counter-Strike 2',fps5070:320,cpuBound:.78,rt:false,upscalers:['fsr']},
 {id:'warface',name:'Warface',fps5070:295,cpuBound:.72,rt:false,upscalers:[]},
 {id:'dota2',name:'Dota 2',fps5070:205,cpuBound:.74,rt:false,upscalers:['fsr']},
 {id:'pubg',name:'PUBG: Battlegrounds',fps5070:158,cpuBound:.30,rt:false,upscalers:[]},
 {id:'bf6',name:'Battlefield 6',fps5070:105,cpuBound:.18,rt:false,upscalers:['dlss','fsr']},
 {id:'warthunder',name:'War Thunder',fps5070:202,cpuBound:.33,rt:true,upscalers:['dlss','fsr']},
 {id:'rust',name:'Rust',fps5070:124,cpuBound:.49,rt:false,upscalers:['dlss']},
 {id:'squad',name:'Squad',fps5070:98,cpuBound:.67,rt:false,upscalers:[]},
 {id:'cyberpunk',name:'Cyberpunk 2077',fps5070:105,cpuBound:.10,rt:true,upscalers:['dlss','fsr']},
 {id:'valorant',name:'Valorant',fps5070:390,cpuBound:.80,rt:false,upscalers:[]}
] as const satisfies ReadonlyArray<{
 id:string;name:string;fps5070:number;cpuBound:number;rt:boolean;upscalers:readonly Feature[];
}>;

const gpuTiers:[RegExp,number][]=[
 [/rtx\s*5090\b/i,2.20],[/rtx\s*5080\b/i,1.43],[/rtx\s*5070\s*ti\b/i,1.18],
 [/rtx\s*5070\b/i,1],[/rtx\s*5060\s*ti\b/i,.75],[/rtx\s*5060\b/i,.61],
 [/rtx\s*4090\b/i,1.42],[/rtx\s*4080\s*super\b/i,1.17],[/rtx\s*4080\b/i,1.12],
 [/rtx\s*4070\s*ti\b/i,.99],[/rtx\s*4070\b/i,.83],[/rtx\s*4060\s*ti\b/i,.64],[/rtx\s*4060\b/i,.51],
 [/rx\s*7900\s*xtx\b/i,1.23],[/rx\s*7800\s*xt\b/i,.82],[/rx\s*7700\s*xt\b/i,.68],
 [/rx\s*7600\b/i,.50]
];
function gpuTier(text:string){return gpuTiers.find(([pattern])=>pattern.test(text))?.[1]??null}
function cpuTier(name:string):number|null{
 if(!/(?:ryzen\s*[3579]\s*\d{4,5}|core\s*i[3579]|i[3579]-\d{4,5}|core\s*ultra)/i.test(name))return null;
 if(/(9800x3d|9950x3d|9850x3d)/i.test(name))return 1.16;
 if(/(7800x3d|7950x3d|7500x3d)/i.test(name))return 1.12;
 if(/(9700x|9900x|14700|14900)/i.test(name))return 1.08;
 if(/(5600|5700|12400|12600)/i.test(name))return .86;
 return 1;
}
export type FpsHardware={gpu:string;cpu:string;ram?:string;platform?:'desktop'|'laptop';gpuPowerWatts?:number};
// Separate illustrative mobile profiles, not measured benchmarks. Scores are
// model assumptions relative to the existing desktop RTX 5070 baseline.
// Power reference points are in watts; do not interpret them as every laptop's TGP.
// NVIDIA model/power specifications: https://www.nvidia.com/en-us/geforce/laptops/compare/
const laptopGpuProfiles:Record<string,{score:number;watts:number}>={
 '5090':{score:1.10,watts:150},'5080':{score:.95,watts:150},
 '5070ti':{score:.77,watts:115},'5070':{score:.60,watts:100},
 '5060':{score:.50,watts:100},'5050':{score:.39,watts:100},
 '4090':{score:.95,watts:150},'4080':{score:.78,watts:150},
 '4070':{score:.55,watts:115},'4060':{score:.46,watts:115},
 '4050':{score:.33,watts:115}
};
function laptopGpuTier(hardware:FpsHardware):number|null{
 const model=hardware.gpu.match(/\bRTX\s*(\d{4})\s*(Ti)?\b/i);
 const profile=model?laptopGpuProfiles[model[1]+(model[2]?'ti':'')]:undefined;
 const power=hardware.gpuPowerWatts;
 if(!profile||!power||!Number.isFinite(power)||power<1||power>250)return null;
 return profile.score*Math.min(1.12,Math.pow(power/profile.watts,.45));
}
function laptopCpuTier(name:string):number|null{
 // Require a mobile family/suffix; never reuse the desktop CPU fallback.
 if(!/(?:core\s*(?:ultra\s*[3579]|i[3579])|i[3579]-|ryzen\s*(?:[3579]|ai))/i.test(name))return null;
 if(/\b\d{3,5}HX3D\b/i.test(name))return 1.10;
 if(/\b\d{3,5}HX\b/i.test(name))return 1;
 if(/\b\d{3,5}(?:HS|H)\b/i.test(name))return .90;
 if(/\b\d{3,5}(?:U|V)\b/i.test(name))return .72;
 if(/ryzen\s*ai\s*[3579]\s*(?:hx\s*)?\d{3}\b/i.test(name))return .90;
 return null;
}
export function fromLaptop(p:Product):FpsHardware{
 const power=Number((p.specs?.gpuPowerWatts||'').replace(',','.'));
 return {platform:'laptop',gpu:p.specs?.gpu||'',cpu:p.specs?.cpu||'',
  ram:p.specs?.capacity? p.specs.capacity+' GB':undefined,
  gpuPowerWatts:Number.isFinite(power)&&power>0?power:undefined};
}
export function fromReadyPC(p:Product):FpsHardware{
 const graphics=p.buildComponents?.gpu||[p.name,p.description].join(' ');
 const graphicsModel=graphics.match(/(?:RTX\s*\d{4}\s*(?:Ti|Super)?|RX\s*\d{4}\s*(?:XTX|XT)?)/i)?.[0]?.trim()||'';
 const processor=p.buildComponents?.cpu||p.description;
 const recognizedCpu=/(?:ryzen\s*\d|core\s*i[3579]|i[3579]-\d{4,5}|core\s*ultra)/i.test(processor);
 return {gpu:graphicsModel,cpu:recognizedCpu?processor:'',ram:p.buildComponents?.ram||p.description};
}
export function fromConfigurator(selected:Record<string,string>,products:Product[]):FpsHardware{
 const byId=(id:string)=>products.find(p=>p.id===selected[id]);
 return {gpu:byId('gpu')?.name||'',cpu:byId('cpu')?.name||'',ram:byId('ram')?.name};
}
export function supportsDlss(hardware:FpsHardware){return /\brtx\s*\d{4}/i.test(hardware.gpu)}
export function supportsRayTracing(hardware:FpsHardware){
 return /\b(?:rtx\s*\d{4}|rx\s*(?:6|7|9)\d{3})/i.test(hardware.gpu);
}
export type GameFpsEstimate={
 id:string;name:string;low:number;high:number;
 rayTracingApplied:boolean;rayTracingAvailable:boolean;
 upscalingApplied:boolean;upscalingAvailable:boolean;
};
export function estimateFps(
 hardware:FpsHardware,
 resolution:FpsResolution,
 requested:Partial<FpsOptions>={}
):GameFpsEstimate[]|null{
 const mobile=hardware.platform==='laptop';
 const gpu=mobile?laptopGpuTier(hardware):gpuTier(hardware.gpu);
 const processor=mobile?laptopCpuTier(hardware.cpu):cpuTier(hardware.cpu);
 if(gpu===null||processor===null)return null;
 const opts={...defaultFpsOptions,...requested};
 const pixels=resolution==='FHD'?1:resolution==='2K'?1.78:4;
 const presetGpuBoost={low:1.60,medium:1.25,high:1,ultra:.81}[opts.preset];
 // Upscaling is modelled as a reduced internal render load, NOT a guarantee
 // of any particular DLSS/FSR implementation or a benchmark result.
 const pixelFraction={quality:.67,balanced:.58,performance:.50}[opts.upscalingQuality];
 const dlssAllowed=opts.upscaling!=='dlss'||supportsDlss(hardware);
 const rtAllowed=supportsRayTracing(hardware);
 return gameProfiles.map(game=>{
  const rayTracingAvailable=game.rt&&rtAllowed;
  const rayTracingApplied=opts.rayTracing&&rayTracingAvailable;
  const upscalingAvailable=opts.upscaling!=='native'&&dlssAllowed&&
   game.upscalers.some(feature=>feature===opts.upscaling);
  const upscalingApplied=upscalingAvailable;
  const renderPixels=pixels*(upscalingApplied?pixelFraction**2:1);
  const resolutionScale=1/Math.pow(renderPixels,.53*(1-game.cpuBound*.65));
  const presetScale=1+(presetGpuBoost-1)*(1-game.cpuBound*.55);
  const cpuFactor=1+(processor-1)*(.25+game.cpuBound*.75);
  const rayFactor=rayTracingApplied?(game.id==='cyberpunk'?.53:.72):1;
  const gpuLimited=game.fps5070*gpu*resolutionScale*presetScale*cpuFactor*rayFactor;
  // Avoid unlimited FPS increases from faster GPUs/upscaling in CPU-heavy games.
  const cpuCeiling=game.fps5070*processor*(1.35+(1-game.cpuBound)*.75);
  const memoryGb=mobile?Number.parseFloat(hardware.ram||''):NaN;
  const memoryFactor=Number.isFinite(memoryGb)?(memoryGb<=8?.80:memoryGb<=16?.94:1):1;
  const average=Math.max(8,Math.round(Math.min(gpuLimited,cpuCeiling)*memoryFactor/5)*5);
  // A narrow illustrative display band (±8%), not a confidence interval.
  const spread=Math.max(5,Math.round(average*.08/5)*5);
  return {
   id:game.id,name:game.name,
   low:Math.max(5,average-spread),high:Math.max(10,average+spread),
   rayTracingApplied,rayTracingAvailable,upscalingApplied,upscalingAvailable
  };
 });
}

/** Highlight rows that can actually respond to active graphics options.
 * Other games keep their original, stable relative order and FPS values. */
export function prioritizeFpsRows(
 rows:ReadonlyArray<GameFpsEstimate>,
 options:Pick<FpsOptions,'rayTracing'|'upscaling'>
):GameFpsEstimate[]{
 const priority=(row:GameFpsEstimate)=>
  (options.rayTracing&&row.rayTracingApplied?2:0)+
  (options.upscaling!=='native'&&row.upscalingApplied?1:0);
 return rows.map((row,index)=>({row,index}))
  .sort((a,b)=>priority(b.row)-priority(a.row)||a.index-b.index)
  .map(({row})=>row);
}
