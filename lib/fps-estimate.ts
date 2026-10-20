import type {Product} from './seed';

export type FpsResolution='FHD'|'2K'|'4K';
export const resolutions=['FHD','2K','4K'] as const;
export const gameProfiles=[
 {id:'cs2',name:'Counter-Strike 2',fps5070:320,cpuBound:.78},
 {id:'warface',name:'Warface',fps5070:295,cpuBound:.72},
 {id:'dota2',name:'Dota 2',fps5070:205,cpuBound:.74},
 {id:'pubg',name:'PUBG: Battlegrounds',fps5070:158,cpuBound:.30},
 {id:'bf6',name:'Battlefield 6',fps5070:105,cpuBound:.18},
 {id:'warthunder',name:'War Thunder',fps5070:202,cpuBound:.33},
 {id:'rust',name:'Rust',fps5070:124,cpuBound:.49},
 {id:'squad',name:'Squad',fps5070:98,cpuBound:.67},
 {id:'cyberpunk',name:'Cyberpunk 2077',fps5070:105,cpuBound:.10},
 {id:'valorant',name:'Valorant',fps5070:390,cpuBound:.80}
] as const;

// Relative tiers are indicative, not measured game benchmarks.
const gpuTiers:[RegExp,number][]=[
 [/rtx\s*5090\b/i,2.20],[/rtx\s*5080\b/i,1.43],[/rtx\s*5070\s*ti\b/i,1.18],
 [/rtx\s*5070\b/i,1],[/rtx\s*5060\s*ti\b/i,.75],[/rtx\s*5060\b/i,.61],
 [/rtx\s*4090\b/i,1.42],[/rtx\s*4080\s*super\b/i,1.17],[/rtx\s*4080\b/i,1.12],
 [/rtx\s*4070\s*ti\b/i,.99],[/rtx\s*4070\b/i,.83],[/rtx\s*4060\s*ti\b/i,.64],[/rtx\s*4060\b/i,.51],
 [/rx\s*7900\s*xtx\b/i,1.23],[/rx\s*7800\s*xt\b/i,.82],[/rx\s*7700\s*xt\b/i,.68],
 [/rx\s*7600\b/i,.50]
];
function tier(text:string){return gpuTiers.find(([pattern])=>pattern.test(text))?.[1]??null}
function cpuScale(name:string){
 if(/(9800x3d|9950x3d|9850x3d)/i.test(name))return 1.16;
 if(/(7800x3d|7950x3d|7500x3d)/i.test(name))return 1.12;
 if(/(9700x|9900x|14700|14900)/i.test(name))return 1.08;
 if(/(7500f|7600|7700|8400f|13400f|14400f)/i.test(name))return 1;
 if(/(5600|5700|12400|12600)/i.test(name))return .86;
 return 1;
}
export type FpsHardware={gpu:string;cpu:string;ram?:string};
export function fromReadyPC(p:Product):FpsHardware{
 const graphics=p.buildComponents?.gpu||[p.name,p.description].join(' ');
 const graphicsModel=graphics.match(/(?:RTX\\s*\\d{4}\\s*(?:Ti|Super)?|RX\\s*\\d{4}\\s*(?:XTX|XT)?)/i)?.[0]||'';
 const processor=p.buildComponents?.cpu||p.description;
 const recognizedCpu=/(?:ryzen\\s*\\d|core\\s*i[3579]|i[3579]-\\d{4,5}|core\\s*ultra)/i.test(processor);
 return {gpu:graphicsModel,
  cpu:recognizedCpu?processor:'',
  ram:p.buildComponents?.ram||p.description};
}
export function fromConfigurator(selected:Record<string,string>,products:Product[]):FpsHardware{
 const byId=(id:string)=>products.find(p=>p.id===selected[id]);
 return {gpu:byId('gpu')?.name||'',cpu:byId('cpu')?.name||'',ram:byId('ram')?.name};
}
export function estimateFps(hardware:FpsHardware,resolution:FpsResolution){
 const gpu=tier(hardware.gpu);
 if(!gpu||!hardware.cpu.trim())return null;
 const processor=cpuScale(hardware.cpu);
 const pixels=resolution==='FHD'?1:resolution==='2K'?1.78:4;
 return gameProfiles.map(game=>{
  // CPU-bound games lose less FPS when going from 1080p to higher resolutions.
  const resolutionFactor=1/Math.pow(pixels,.53*(1-game.cpuBound*.65));
  const cpuFactor=1+(processor-1)*(.25+game.cpuBound*.75);
  const avg=Math.round(game.fps5070*gpu*resolutionFactor*cpuFactor/5)*5;
  return {id:game.id,name:game.name,low:Math.max(15,Math.round(avg*.8/5)*5),high:Math.max(20,Math.round(avg*1.2/5)*5)};
 });
}
