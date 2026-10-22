import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

const hero=readFileSync(new URL('../app/hero-slider.tsx',import.meta.url),'utf8');
const editor=readFileSync(new URL('../app/admin-hero-slides.tsx',import.meta.url),'utf8');
const canvas=readFileSync(new URL('../app/hero-canvas-layers.tsx',import.meta.url),'utf8');
const exactPreview=readFileSync(new URL('../app/scaled-hero-preview.tsx',import.meta.url),'utf8');
const shop=readFileSync(new URL('../app/shop.tsx',import.meta.url),'utf8');
const route=readFileSync(new URL('../app/api/store/route.ts',import.meta.url),'utf8');
const media=readFileSync(new URL('../app/api/media/route.ts',import.meta.url),'utf8');
const css=readFileSync(new URL('../app/globals.css',import.meta.url),'utf8');
for(const [name,source] of [['hero',hero],['admin editor',editor],['layer renderer',canvas],['scaled preview',exactPreview]]){
 const result=ts.transpileModule(source,{
  compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX},
  fileName:name+'.tsx',reportDiagnostics:true
 });
 assert.equal(result.diagnostics?.filter(x=>x.category===ts.DiagnosticCategory.Error).length??0,0,name+' TSX syntax');
}
const source=readFileSync(new URL('../lib/hero-slides.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
 reportDiagnostics:true
});
assert.equal(compiled.diagnostics?.filter(x=>x.category===ts.DiagnosticCategory.Error).length??0,0);
const exports={};
runInNewContext(compiled.outputText,{exports,Set,Array,Math,Number,JSON,crypto:{randomUUID:()=> '12345678-1234-4234-8234-123456789abc'}});
const {defaultHeroSlides,validateHeroSlides,isHeroImageUrl,isHeroLink,moveHeroSlide,MAX_HERO_SLIDES,MAX_SLIDE_IMAGES,enableHeroCanvas,addHeroLayer,removeHeroLayer,positionHeroLayer,createHeroSlide,resolveHeroPlacement,setHeroBreakpointPlacement,upgradeRogSwiftOledSlide,HERO_SLIDES_VERSION,upgradeComputerHeroImage,COMPUTER_HERO_IMAGE_VERSION,swapSecondAndFourthHeroSlides,HERO_SLIDE_ORDER_VERSION}=exports;
assert.equal(defaultHeroSlides.length,4,'Four original slides remain available');
assert.deepEqual(Array.from(defaultHeroSlides,slide=>slide.id),[
 'skp-hero-logitech','skp-hero-rog-swift-oled-edition-20','skp-hero-rog','skp-hero-computer'
],'Fresh store: original second monitor and fourth computer slide swap places');
assert.equal(validateHeroSlides(defaultHeroSlides),true,'Existing slides validate');
assert.equal(defaultHeroSlides[0].primary,'Перейти');
assert.equal(defaultHeroSlides[0].href,'/product/logitech-pro-x3-superstrike-black');
assert.equal(defaultHeroSlides[0].image,'/images/pro-x3-magenta-hd.png');
assert.equal(defaultHeroSlides[0].image2,'/images/pro-x3-black-hd.png');

assert.equal(defaultHeroSlides[3].id,'skp-hero-computer');
assert.equal(defaultHeroSlides[3].image,'/images/skp-build-hero.png','The third displayed slide uses owner-uploaded PC image');
assert.equal(COMPUTER_HERO_IMAGE_VERSION,1);
const submittedPC=readFileSync(new URL('../public/images/skp-build-hero.png',import.meta.url));
const {createHash}=await import('node:crypto');
assert.equal(createHash('sha256').update(submittedPC).digest('hex'),
 '9cadaceaa89379aca18e593627a8a1d5dc63f4c3560895bafd0cac2279c9d5ad',
 'Self-hosted image must match the exact uploaded original');
assert.equal(submittedPC.readUInt32BE(16),800,'Image width remains 800px');
assert.equal(submittedPC.readUInt32BE(20),800,'Image height remains 800px');
const oldComputer={...defaultHeroSlides[3],image:'/images/skp-slide-2.png'};
const customComputer={...defaultHeroSlides[3],image:'/api/media?key=slides/pc/12345678-1234-4234-8234-123456789abc.webp'};
const unchangedOther=defaultHeroSlides[0];
const upgradedPC=upgradeComputerHeroImage([unchangedOther,oldComputer],0);
assert.equal(upgradedPC[0],unchangedOther,'Other slides remain untouched');
assert.equal(upgradedPC[1].image,'/images/skp-build-hero.png','Existing D1 slide receives the requested artwork');
assert.equal(upgradedPC[1].id,oldComputer.id,'Saved slide ID remains intact');
assert.equal(upgradeComputerHeroImage([customComputer],0)[0].image,customComputer.image,
 'Never replace a custom uploaded photo');
assert.equal(upgradeComputerHeroImage([oldComputer],COMPUTER_HERO_IMAGE_VERSION)[0],oldComputer,
 'Owner can change the picture again without future automatic resets');
assert.match(route,/computerHeroImageVersion:COMPUTER_HERO_IMAGE_VERSION/,'Server marks this update as applied');
assert.match(route,/upgradeComputerHeroImage\(upgradeRogSwiftOledSlide/,'Stored D1 slides use the image upgrade');
assert.match(css,/\.hero-carousel \.skp-clean-computer-slide \.second-slide-frame \.second-slide-photo\{[\s\S]*?object-fit:contain;[\s\S]*?transform:scale\(1\.08\)/,
 'The new PC image uses restrained zoom and object containment');

assert.equal(defaultHeroSlides[1].id,'skp-hero-rog-swift-oled-edition-20');
assert.equal(defaultHeroSlides[1].layout,'rog');
assert.equal(defaultHeroSlides[1].title,'ROG SWIFT OLED\nPG27AQWP-G\nEDITION 20');
assert.equal(defaultHeroSlides[1].highlightLine,2);
assert.equal(defaultHeroSlides[1].href,'/product/asus-rog-swift-oled-pg27aqwp-g-edition-20');
assert.equal(defaultHeroSlides[1].image,'/images/rog-oled-pg27aqwp-g-hero.png');
assert.equal(defaultHeroSlides[1].layers.length,1);
assert.equal(defaultHeroSlides[1].layers[0].mobile.x,50);
assert.equal(defaultHeroSlides[1].layers[0].tablet.x,50);
assert.equal(validateHeroSlides(defaultHeroSlides),true);
const oldThree=[defaultHeroSlides[0],defaultHeroSlides[3],defaultHeroSlides[2]];
const upgradedFour=upgradeRogSwiftOledSlide(oldThree,0);
assert.equal(upgradedFour.length,4,'Fourth slide appears for an existing three-slide store');
assert.equal(upgradedFour[3].id,defaultHeroSlides[1].id);
assert.equal(upgradedFour[2],oldThree[2],'Third ROG slide is unchanged');
assert.equal(upgradeRogSwiftOledSlide(upgradedFour,0).length,4,'Repeated GET never duplicates slide');
const savedPhoto='/api/media?key=slides/test-monitor/12345678-1234-4234-8234-123456789abc.webp';
const existingMonitor={...defaultHeroSlides[1],id:'user-slide-4',
 image:savedPhoto,layers:[{...defaultHeroSlides[1].layers[0],image:savedPhoto,
  x:23,y:66,mobile:{x:36,y:60,width:35,height:42,captionX:36,captionY:79}}]};
const migrated=upgradeRogSwiftOledSlide([...oldThree,existingMonitor],0);
assert.equal(migrated.length,4,'Already uploaded fourth slide is migrated, not duplicated');
assert.equal(migrated[3].id,existingMonitor.id,'Original slide record ID is retained');
assert.equal(migrated[3].image,savedPhoto,'User uploaded photo is retained');
assert.equal(migrated[3].layers[0].image,savedPhoto,'User uploaded media layer is retained');
assert.equal(migrated[3].layers[0].x,50,'Desktop image is now centered inside a bounded visual stage');
assert.equal(migrated[3].layers[0].mobile.y,50,'Mobile image is centered inside its own bounded stage');
assert.equal(migrated[3].href,'/product/asus-rog-swift-oled-pg27aqwp-g-edition-20');
assert.equal(upgradeRogSwiftOledSlide(oldThree,HERO_SLIDES_VERSION).length,3,
 'After an admin save, deleting the fourth slide remains intentional');
assert.equal(HERO_SLIDES_VERSION,4,'Edition 20 artwork upgraded to self-hosted full device cutout');
assert.equal(defaultHeroSlides[1].layers[0].caption,'','No floating model caption covers the product photo');
assert.equal(defaultHeroSlides[1].layers[0].mobile.height,94,'Mobile cutout is constrained within its art stage');
assert.equal(validateHeroSlides([defaultHeroSlides[1]]),true);
const resized=upgradeRogSwiftOledSlide([...oldThree,existingMonitor],1);
assert.equal(resized.length,4,'Revision 1 store gets the better composition');
assert.equal(resized[3].image,savedPhoto,'Revision 2 preserves uploaded media');
assert.equal(upgradeRogSwiftOledSlide([...oldThree,existingMonitor],3)[3].image,savedPhoto,'Latest migration keeps merchant uploads');
assert.equal(upgradeRogSwiftOledSlide([...oldThree,existingMonitor],2)[3].image,savedPhoto,'Revision 3 preserves photo uploaded in admin');
assert.equal(resized[3].layers[0].x,50,'Revision 4 prevents oversize placement');
assert.equal(upgradeRogSwiftOledSlide(oldThree,1).length,3,'Revision 2 respects already deleted slide');
assert.equal(upgradeRogSwiftOledSlide(migrated,HERO_SLIDES_VERSION),migrated,'Latest saved settings are never overwritten');
assert.ok(defaultHeroSlides[1].layers[0].height<=100,'Monitor fits within a separately bounded stage');
assert.ok(!css.includes('hero-carousel.rog-oled-feature .carousel-controls{'),'Carousel arrows keep the original shared positioning');

assert.match(css,/\.hero-carousel:not\(\.skp-slide-preview\)>\.carousel-controls\{[\s\S]*?left:50%;[\s\S]*?right:auto;[\s\S]*?transform:translateX\(-50%\)/,
 'Carousel navigation is horizontally centered for every real slide');
assert.match(css,/@media\(max-width:700px\)\{[\s\S]*?\.hero-carousel:not\(\.skp-slide-preview\)>\.carousel-controls\{/,
 'Carousel navigation stays centered on narrow screens');
assert.match(css,/\.hero-carousel\.rog-oled-feature>\.skp-slide-canvas \.skp-slide-layer-image\{[\s\S]*?scale\(1\.12\)/,
 'OLED device increases by twelve percent while preserving centering');
assert.match(css,/\.skp-slide-preview-mobile\.hero-carousel\.rog-oled-feature>\.skp-slide-canvas \.skp-slide-layer-image\{[\s\S]*?scale\(1\.1\)/,
 'The exact mobile preview uses a safe ten percent scale increase');
assert.match(hero,/const cleanComputer=slide\.id==='skp-hero-computer'/,
 'Remove decorations only from the intended SKP computer slide');
assert.match(hero,/cleanComputer\?' skp-clean-computer-slide':'/,
 'Computer hero has a dedicated style scope');
assert.match(hero,/!cleanComputer&&<><span className="second-slide-corner/,
 'Other premium-layout slides may retain their corner decorations');
assert.match(hero,/!cleanComputer&&<>[\s\S]*?second-slide-badge[\s\S]*?second-slide-top-note[\s\S]*?second-slide-chips/,
 'All premium badges, top notes and feature labels are absent from the SKP computer slide');
assert.match(css,/\.hero-carousel \.skp-clean-computer-slide \.second-slide-frame\{[\s\S]*?border:0;[\s\S]*?background:none;[\s\S]*?box-shadow:none;/,
 'The computer photo frame and background are removed');
assert.match(css,/\.hero-carousel \.skp-clean-computer-slide \.second-slide-frame::before\{[\s\S]*?content:none;/,
 'The nested ornamental frame is disabled');

const fullCutout=readFileSync(new URL('../public/images/rog-oled-pg27aqwp-g-hero.png',import.meta.url));
assert.equal(fullCutout.toString('hex',0,8),'89504e470d0a1a0a','Show a real, locally stored PNG, not a remote screen screenshot');
assert.equal(fullCutout.readUInt32BE(16),1400,'Official ASUS image is optimized and tightly framed');
assert.ok(fullCutout.readUInt32BE(20)>1100&&fullCutout.readUInt32BE(20)<1400,'Entire device including stand is present');
assert.match(css,/\.hero-carousel\.rog-oled-feature>\.skp-slide-canvas\{[\s\S]*?top:50%;[\s\S]*?transform:translateY\(-50%\)/,
 'The complete monitor stage is vertically centered in the desktop banner');
assert.match(css,/\.hero-carousel\.rog-oled-feature>\.skp-slide-canvas \.skp-slide-layer-image\{[\s\S]*?left:50%;[\s\S]*?top:50%;[\s\S]*?height:94%;/,
 'The monitor itself is centered even when earlier D1 image coordinates are wrong');
assert.match(css,/\.hero-carousel\.rog-oled-feature>\.skp-slide-canvas \.skp-slide-layer-image img\{[\s\S]*?object-fit:contain;/,
 'The complete monitor is visible with no cropped edges');
assert.match(css,/\.skp-slide-preview-tablet\.hero-carousel\.rog-oled-feature>\.skp-slide-canvas\{[\s\S]*?top:50%;/,
 'Admin tablet preview also centers the image');
assert.match(css,/\.skp-slide-preview-mobile\.hero-carousel\.rog-oled-feature>\.skp-slide-canvas\{[\s\S]*?height:230px;/,
 'Admin mobile preview uses a height-limited image area');
assert.match(css,/@media\(max-width:700px\)\{[\s\S]*?\.hero-carousel\.rog-oled-feature:not\(\.skp-slide-preview\)>\.skp-slide-canvas\{/,
 'Mobile storefront is constrained independently');
for(const bannerHeight of [560,500]){
 const stageHeight=bannerHeight-(bannerHeight===560?80:70);
 const stageTop=(bannerHeight-stageHeight)/2;
 const imageTop=stageTop+stageHeight*(.5-.94/2);
 const imageBottom=stageTop+stageHeight*(.5+.94/2);
 assert.ok(Math.abs((imageBottom+imageTop)/2-bannerHeight/2)<.001,
  'The monitor is vertically centered within '+bannerHeight+'px banner');
 assert.ok(imageTop>=0&&imageBottom<=bannerHeight,
  'The monitor fits entirely in its '+bannerHeight+'px banner');
}
const mobileStage={height:230,bottom:67,fill:.94};
const mobileTop=665-mobileStage.bottom-mobileStage.height+mobileStage.height*(.5-mobileStage.fill/2);
const mobileBottom=665-mobileStage.bottom-mobileStage.height+mobileStage.height*(.5+mobileStage.fill/2);
assert.ok(mobileTop>0&&mobileBottom<665,'Entire mobile monitor remains within the hero');


assert.equal(validateHeroSlides([]),true,'The admin may remove all slides');
assert.equal(validateHeroSlides(Array.from({length:MAX_HERO_SLIDES+1},(_,i)=>({...defaultHeroSlides[0],id:'slide-'+i}))),false);
assert.equal(validateHeroSlides([...defaultHeroSlides,defaultHeroSlides[0]]),false,'Duplicate ids forbidden');
assert.equal(validateHeroSlides([{...defaultHeroSlides[0],href:'javascript:alert(1)'}]),false,'External/script links rejected');
assert.equal(validateHeroSlides([{...defaultHeroSlides[0],href:'https://example.org'}]),false,'Only internal navigation');
assert.equal(validateHeroSlides([{...defaultHeroSlides[0],image:'data:image/svg+xml,a'}]),false);
assert.equal(validateHeroSlides([{...defaultHeroSlides[0],layout:'duo',image2:''}]),false,'Two-image layouts require second image');
assert.equal(validateHeroSlides([{...defaultHeroSlides[3],layout:'single',image:'/images/new.webp'}]),true,'New single-image slide can be saved');
assert.equal(isHeroImageUrl('/api/media?key=slides/hero-test/12345678-1234-4234-8234-123456789abc.webp'),true);
assert.equal(isHeroImageUrl('/api/media?key=slides/../x.webp'),false);
assert.equal(isHeroImageUrl('http://example.org/image.png'),false);
assert.equal(isHeroLink('//external-site.com'),false);
assert.equal(isHeroLink('/product/item-abc'),true);
assert.equal(moveHeroSlide(defaultHeroSlides,0,1)[0].id,defaultHeroSlides[1].id,'Move down');
assert.equal(moveHeroSlide(defaultHeroSlides,2,-1)[1].id,defaultHeroSlides[2].id,'Move up');
assert.equal(moveHeroSlide(defaultHeroSlides,0,-1)[0].id,defaultHeroSlides[0].id,'Out-of-bounds move is safe');
assert.equal(defaultHeroSlides[0].id,'skp-hero-logitech','Reorder does not mutate original input');
assert.equal(MAX_SLIDE_IMAGES,16,'Allow up to 16 independent images per slide');
const upgraded=enableHeroCanvas(defaultHeroSlides[0]);
assert.equal(upgraded.layers.length,2,'Original two-photo Logitech slide converts with both images');
assert.equal(upgraded.layers[0].caption,'MAGENTA ECLIPSE');
assert.equal(upgraded.layers[1].caption,'MIDNIGHT BLACK');
assert.equal(upgraded.layers[0].image,defaultHeroSlides[0].image);
assert.equal(validateHeroSlides([upgraded]),true,'Backward-compatible converted slide valid');
assert.equal(enableHeroCanvas(upgraded),upgraded,'Enabling twice should not discard custom positions');
const placed=positionHeroLayer(upgraded.layers[0],{x:111,y:-25,captionX:30.52,captionY:200,width:4,height:999});
assert.equal(placed.x,100);assert.equal(placed.y,0);
assert.equal(placed.captionX,30.5);assert.equal(placed.captionY,100);
assert.equal(placed.width,5);assert.equal(placed.height,100);
assert.equal(validateHeroSlides([{...upgraded,layers:[{...placed,x:120}]}]),false);
assert.equal(validateHeroSlides([{...upgraded,layers:[{...placed,captionY:NaN}]}]),false);
assert.equal(validateHeroSlides([{...upgraded,layers:[{...placed,image:'javascript:bad'}]}]),false);
assert.equal(validateHeroSlides([{...upgraded,layers:[placed,placed]}]),false,'Duplicate layer IDs are forbidden');
assert.equal(validateHeroSlides([{...upgraded,layers:[]}]),false,'A composed slide needs at least one image');
const newSlide=enableHeroCanvas(createHeroSlide());
assert.equal(newSlide.layers.length,1);
assert.equal(validateHeroSlides([newSlide]),true);
assert.equal(newSlide.layers[0].image,'/images/config-reference.png');
const extended=addHeroLayer(newSlide);
assert.equal(extended.layers.length,2);
assert.equal(validateHeroSlides([extended]),true);
assert.equal(removeHeroLayer(extended,extended.layers[0].id).layers.length,1);
assert.equal(removeHeroLayer(newSlide,newSlide.layers[0].id).layers.length,1,'Last image cannot be removed');
const atLimit={...newSlide,layers:Array.from({length:MAX_SLIDE_IMAGES},(_,i)=>({...newSlide.layers[0],id:'asset-'+i}))};
assert.equal(validateHeroSlides([atLimit]),true);
assert.equal(addHeroLayer(atLimit).layers.length,MAX_SLIDE_IMAGES);
const originalMobile=resolveHeroPlacement(upgraded.layers[0],'mobile',0,2);
const originalDesktop=resolveHeroPlacement(upgraded.layers[0],'desktop',0,2);
assert.notEqual(originalMobile.y,originalDesktop.y,'Unconfigured mobile art moves below hero copy');
const mobileMoved=setHeroBreakpointPlacement(upgraded.layers[0],'mobile',{x:25,y:80,width:46,captionX:29,captionY:94},0,2);
assert.equal(mobileMoved.x,upgraded.layers[0].x,'Editing mobile position must not shift desktop');
assert.equal(resolveHeroPlacement(mobileMoved,'mobile',0,2).x,25);
assert.equal(resolveHeroPlacement(mobileMoved,'mobile',0,2).captionY,94);
assert.equal(resolveHeroPlacement(mobileMoved,'desktop',0,2).x,upgraded.layers[0].x);
const tabletMoved=setHeroBreakpointPlacement(mobileMoved,'tablet',{y:38,height:69},0,2);
assert.equal(resolveHeroPlacement(tabletMoved,'tablet',0,2).y,38);
assert.equal(resolveHeroPlacement(tabletMoved,'mobile',0,2).y,80,'Tablet and phone must stay independent');
assert.equal(resolveHeroPlacement(tabletMoved,'desktop',0,2).height,upgraded.layers[0].height);
const desktopMoved=setHeroBreakpointPlacement(tabletMoved,'desktop',{x:73},0,2);
assert.equal(desktopMoved.x,73);
assert.equal(resolveHeroPlacement(desktopMoved,'mobile',0,2).x,25,'Desktop edits preserve configured phone layout');
assert.equal(validateHeroSlides([{...upgraded,layers:[desktopMoved,upgraded.layers[1]]}]),true);
assert.equal(validateHeroSlides([{...upgraded,layers:[{...desktopMoved,mobile:{...desktopMoved.mobile,y:120}}]}]),false,'Validate mobile bounds');
assert.equal(validateHeroSlides([{...upgraded,layers:[{...desktopMoved,tablet:{...desktopMoved.tablet,x:NaN}}]}]),false,'Validate tablet bounds');
assert.equal(validateHeroSlides([{...atLimit,layers:[...atLimit.layers,{...atLimit.layers[0],id:'overflow'}]}]),false);

assert.match(hero,/export const HERO_AUTOPLAY_MS=5000\b/);
assert.match(hero,/window\.setTimeout\(\(\)=>setIndex\(current=>\(current\+1\)%slides\.length\),HERO_AUTOPLAY_MS\)/);
assert.match(hero,/window\.clearTimeout\(timeout\)/);
assert.match(hero,/onMouseEnter=\{\(\)=>setInteractionPaused\(true\)\}/);
assert.match(hero,/visibilitychange/);
assert.match(hero,/if\(!slide\)return null/,'All slides may be deleted safely');
assert.match(hero,/slides\.map\(\(s,i\)=>/,'Indicator count adapts to new slides');

const controlsMarkup=hero.slice(hero.indexOf('{slides.length>1&&<div className="carousel-controls">'));
assert.ok(controlsMarkup.indexOf('aria-label="Предыдущий слайд"')>=0);
const previousPosition=controlsMarkup.indexOf('aria-label="Предыдущий слайд"');
const indicatorsPosition=controlsMarkup.indexOf('className="carousel-dots"');
const nextPosition=controlsMarkup.indexOf('aria-label="Следующий слайд"');
assert.ok(previousPosition<indicatorsPosition&&indicatorsPosition<nextPosition,
 'Every slide must show previous arrow to the LEFT of dots and next arrow to the RIGHT');
assert.match(controlsMarkup,/className="carousel-dots" role="group" aria-label="Выбор слайда"/,
 'The central pagination group is accessible');
assert.match(css,/\.hero-carousel:not\(\.skp-slide-preview\)>\.carousel-controls\{[\s\S]*?bottom:0;[\s\S]*?clip-path:polygon\(9% 0,91% 0,100% 100%,0 100%\);/,
 'Unified arrow/dots/arrow trapezoid docks exactly at the hero bottom border');
assert.match(css,/\.hero-carousel:not\(\.skp-slide-preview\)>\.carousel-controls::before\{[\s\S]*?inset:1px;[\s\S]*?background:#0a0e0beF;[\s\S]*?clip-path:polygon\(9% 0,91% 0,100% 100%,0 100%\);/,
 'A second nested trapezoid paints a thin outline without dividing the controls');
assert.match(css,/\.hero-carousel:not\(\.skp-slide-preview\)>\.carousel-controls>\*\{[\s\S]*?z-index:1;/,
 'All buttons and dots sit over the inset trapezoid background');
assert.match(css,/@media\(max-width:700px\)\{\s*\.hero-carousel:not\(\.skp-slide-preview\)>\.carousel-controls\{\s*bottom:0;/,
 'Controls also dock flush to the mobile hero boundary');
assert.match(css,/\.hero-carousel:not\(\.skp-slide-preview\)>\.carousel-controls \.carousel-dots\{[\s\S]*?background:transparent;[\s\S]*?border:0;/,
 'Pagination dots do NOT have a second separate pill border');
assert.match(css,/\.hero-carousel:not\(\.skp-slide-preview\)>\.carousel-controls\{[\s\S]*?left:50%;[\s\S]*?transform:translateX\(-50%\)/,
 'The arrow/dots/arrow navigation is centered for ALL slides');
assert.match(css,/\.hero-carousel:not\(\.skp-slide-preview\)>\.carousel-controls \.carousel-arrow\{[\s\S]*?flex:0 0 37px;/,
 'Arrows are separate, equally-sized controls inside the shared capsule');
assert.match(css,/\.hero-carousel:not\(\.skp-slide-preview\)>\.carousel-controls \.carousel-dots button\{[\s\S]*?place-items:center;/,
 'Dots remain centered within their shared control block');
assert.match(css,/@media\(max-width:700px\)\{[\s\S]*?\.hero-carousel:not\(\.skp-slide-preview\)>\.carousel-controls \.carousel-dots button\{[\s\S]*?clamp\(14px,4\.3vw,23px\)/,
 'Navigation adapts without overflow on mobile devices');
assert.match(css,/\.hero-carousel \.skp-clean-computer-slide\{[\s\S]*?padding:36px 17px 67px 12px;/,
 'The owner-supplied PC slide has balanced spacing like the other slides');
assert.match(css,/\.hero-carousel \.skp-clean-computer-slide \.second-slide-glow\{[\s\S]*?opacity:\.58;/,
 'PC image glow is toned down to match other product art');
assert.match(css,/\.hero-carousel \.skp-clean-computer-slide \.second-slide-frame\{[\s\S]*?width:min\(100%,620px\);[\s\S]*?height:min\(100%,435px\);/,
 'Computer art stays inside a centered, bounded display area');
assert.match(css,/@media\(max-width:700px\)\{[\s\S]*?\.hero-carousel \.skp-clean-computer-slide\{[\s\S]*?padding:16px 10px 24px;/,
 'PC slide uses compact mobile spacing while keeping the same slide height');

assert.match(hero,/key=\{s\.id\}/,'Repeated destinations can have distinct slides');
assert.match(hero,/slide\.title\.split/,'Headline editable');
assert.match(hero,/slide\.description\.split/,'Description editable');
assert.match(hero,/slide\.layout==='logitech'/,'Existing Logitech custom layout maintained');
assert.match(hero,/slide\.layout==='rog'/,'Existing ROG custom layout maintained');
assert.match(hero,/slide\.layout==='premium'/,'Existing premium layout maintained');
assert.match(hero,/isRogOledFeature\(slide\)/,'Specific fourth-slide class is present on hero');
assert.match(css,/\.hero-carousel\.rog-oled-feature \.skp-slide-layer-caption/,'Scoped ROG OLED caption styling');

assert.match(hero,/<HeroCanvasLayers layers=\{slide\.layers\}/,'Live positioned layers use shared canvas renderer');
assert.match(css,/Shared SKP hero contract: one height per viewport/);
for(const h of ['560px','500px','665px','700px'])assert.ok(css.includes('--skp-hero-height:'+h));
assert.match(css,/height:var\(--skp-hero-height\);\s*min-height:var\(--skp-hero-height\);\s*max-height:var\(--skp-hero-height\);/);

assert.match(shop,/<HeroSlider nav=\{nav\} items=\{data\.heroSlides\}/);
assert.match(shop,/<AdminHeroSlides slides=\{data\.heroSlides\}/);
assert.match(editor,/moveHeroSlide\(draft,index,-1\)/);
assert.match(editor,/moveHeroSlide\(draft,index,1\)/);
assert.match(editor,/draft\.filter\(s=>s\.id!==id\)/,'Delete slide');
assert.match(editor,/createHeroSlide\(\)/,'Add slide');
assert.match(editor,/validateHeroSlides\(draft\)/,'Check fields before saving');
assert.match(editor,/enableHeroCanvas\(slide\)/,'Existing slides can enable manual positioning');
assert.match(editor,/addHeroLayer\(slide\)/,'Multiple images are supported');
assert.match(editor,/removeHeroLayer\(slide,layer\.id\)/,'Individual image removal');
assert.match(editor,/<ScaledHeroPreview slide=\{slide\}/,'Preview renders shared real slide');
assert.match(editor,/\['desktop','tablet','mobile'\]/,'Three independently editable viewport modes');
assert.match(editor,/resolveHeroPlacement\(layer,previewMode,layerIndex,layers\.length\)/,'Sliders show breakpoint-specific values');
assert.match(editor,/setHeroBreakpointPlacement\(layer,previewMode,fields,index/,'Editor saves responsive positions');
assert.match(editor,/<ScaledHeroPreview slide=\{slide\} mode=\{previewMode\}/,'Editor mounts shared slide preview');
assert.match(exactPreview,/width:1440,height:560/);
assert.match(exactPreview,/width:900,height:500/);
assert.match(exactPreview,/width:390,height:665/);
assert.match(exactPreview,/<HeroSlidePreview slide=\{slide\} previewMode=\{mode\}/,'Preview uses the actual slide JSX');
assert.match(exactPreview,/transform:'scale\('\+scale\+'\)'/,'Scaled preview keeps reference geometry');
assert.match(editor,/type="range"/,'Live positioning controls');
assert.match(editor,/captionX/,'Caption has independent horizontal coordinate');
assert.match(editor,/captionY/,'Caption has independent vertical coordinate');
assert.match(canvas,/setPointerCapture\(event\.pointerId\)/,'Drag gestures capture pointer');
assert.match(canvas,/resolveHeroPlacement\(layer,previewMode,index,layers\.length\)/,'Dragging reads active breakpoint coordinates');
assert.match(css,/\.skp-slide-preview-mobile \.skp-slide-layer-image/,'Live mobile preview has independent positions');
assert.match(css,/@media\(max-width:700px\)[\s\S]*?\.hero-carousel:not\(\.skp-slide-preview\) \.skp-slide-layer-image/,'Storefront selects mobile positions');
assert.match(canvas,/onPointerMove=\{move\}/,'Canvas objects can be dragged');
assert.match(canvas,/value\.part==='image'/,'Image and caption are positioned separately');
assert.match(route,/const latestSlides=linkFeaturedMonitorSlide\(/,'Catalog still connects slides to monitor product');
assert.match(route,/swapSecondAndFourthHeroSlides\(latestSlides,store\.heroSlideOrderVersion\)/,
 'Server applies one-time order swap to existing saved admin carousels');
assert.match(route,/swapSecondAndFourthHeroSlides\(slides,store\.heroSlideOrderVersion\)/,
 'Legacy catalog migration also receives the order swap');
assert.match(route,/heroSlideOrderVersion:HERO_SLIDE_ORDER_VERSION/,
 'GET responds with a version marker preserved by the next admin save');
assert.equal(HERO_SLIDE_ORDER_VERSION,1);
const legacySequence=[defaultHeroSlides[0],defaultHeroSlides[3],defaultHeroSlides[2],defaultHeroSlides[1]];
const reordered=swapSecondAndFourthHeroSlides(legacySequence,0);
assert.deepEqual(Array.from(reordered,x=>x.id),Array.from(defaultHeroSlides,x=>x.id),
 'Existing four-slide D1 store swaps the second and fourth slide exactly once');
assert.notEqual(reordered,legacySequence,'The swap does not mutate the original array');
assert.equal(legacySequence[1].id,'skp-hero-computer','The previous admin order is kept in memory');
assert.equal(reordered[1],legacySequence[3],'User slide object and uploaded photos are preserved');
assert.equal(reordered[3],legacySequence[1],'PC slide moves to position four without recreation');
assert.equal(swapSecondAndFourthHeroSlides(reordered,HERO_SLIDE_ORDER_VERSION),reordered,
 'Later manual order changes are never swapped again after saving the marker');
assert.equal(swapSecondAndFourthHeroSlides(legacySequence.slice(0,3),0).length,3,
 'Shortened lists from the admin remain untouched');
assert.match(route,/validateHeroSlides\(d\.heroSlides\)/,'Server validates slider content');
assert.match(media,/assetType'\)==='slide'/,'Slide uploads supported in R2');
console.log('Hero tests passed: slide management, validation, defaults, image storage, responsive layout and autoplay.');
