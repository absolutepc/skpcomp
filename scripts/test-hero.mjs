import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const hero=readFileSync(new URL('../app/hero-slider.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../app/globals.css',import.meta.url),'utf8');
const checked=ts.transpileModule(hero,{
 compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX},
 fileName:'hero-slider.tsx',reportDiagnostics:true
});
assert.equal(checked.diagnostics?.filter(x=>x.category===ts.DiagnosticCategory.Error).length??0,0,'Hero JSX must parse');
assert.match(hero,/export const HERO_AUTOPLAY_MS=5000\b/,'Slide interval is five seconds');
assert.match(hero,/window\.setTimeout\(\(\)=>setIndex\(current=>\(current\+1\)%slides\.length\),HERO_AUTOPLAY_MS\)/);
assert.match(hero,/window\.clearTimeout\(timeout\)/,'Timer cleans up on unmount, pause and index change');
assert.match(hero,/\[index,interactionPaused,pageHidden\]/,'Manual navigation restarts the timer');
assert.match(hero,/onMouseEnter=\{\(\)=>setInteractionPaused\(true\)\}/,'Autoplay pauses on hover');
assert.match(hero,/onFocusCapture=\{\(\)=>setInteractionPaused\(true\)\}/,'Autoplay pauses on keyboard focus');
assert.match(hero,/visibilitychange/,'Background browser tabs do not cycle');
assert.ok(!hero.includes("из 3"),'Accessibility counts must use the number of configured slides');
assert.match(hero,/из \$\{slides\.length\}/,'Announcements adjust as slides are added');
assert.match(hero,/className="mouse-duo-showcase"/);
assert.match(hero,/MAGENTA ECLIPSE/);
assert.match(hero,/MIDNIGHT BLACK/);
assert.match(hero,/LOGITECH G<br\/><span>PRO X3<\/span><br\/>SUPERSTRIKE/);
assert.match(hero,/role="group" aria-label="Logitech G PRO X3 SUPERSTRIKE/);
assert.match(css,/Shared SKP hero contract: one height per viewport/);
for(const h of ['560px','500px','665px','700px']){
 assert.ok(css.includes('--skp-hero-height:'+h),'Missing responsive height '+h);
}
assert.match(css,/\.hero-carousel,\s*\.hero-carousel\.mouse-launch,\s*\.hero-carousel\.rog-anniversary\s*\{\s*--skp-hero-height:560px;/,
 'All current and future slides share the same base slide size');
assert.match(css,/height:var\(--skp-hero-height\);\s*min-height:var\(--skp-hero-height\);\s*max-height:var\(--skp-hero-height\);/);
assert.match(css,/\.hero-carousel\.mouse-launch h1 span\{color:#ffe500\}/,'Logitech title uses the ROG highlight');
assert.match(css,/\.hero-carousel \.mouse-duo-showcase/);
console.log('Hero slider checks passed: autoplay, pause, dynamic slide counts, first-slide layout, unified dimensions.');
