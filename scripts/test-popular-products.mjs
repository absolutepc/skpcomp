import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
const exports={};
runInNewContext(ts.transpileModule(readFileSync('lib/popular-products.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const {popularProducts}=exports;
const product=(id,category,stock=true,price=100)=>({id,category,stock,price});
const original=[product('rtx-5070','gpu'),product('intel-i5','cpu'),product('b760','motherboard'),product('ddr4','ram'),product('ssd-1tb','ssd'),product('mouse','mouse')];
const ids=items=>items.map(p=>p.id).join(',');
assert.equal(ids(popularProducts(original)),ids(original));
const remainder=original.slice(1);
const catalog=[...remainder,product('gpu-no-price','gpu',true,0),product('gpu-order','gpu',false),product('gpu-new','gpu')];
const snapshot=JSON.stringify(catalog);
assert.equal(popularProducts(catalog)[0].id,'gpu-new');
assert.equal(popularProducts(catalog).length,6);
assert.equal(ids(popularProducts(catalog).slice(1)),ids(remainder));
assert.equal(JSON.stringify(catalog),snapshot,'Selection must not mutate catalog');
const fallback=[...remainder,product('keyboard-new','keyboard')];
assert.equal(popularProducts(fallback)[0].id,'keyboard-new');
const fresh=Array.from({length:10},(_,i)=>product('new-'+i,'monitor'));
assert.equal(popularProducts(fresh).length,6);
assert.equal(new Set(popularProducts(fresh).map(p=>p.id)).size,6);
assert.equal(popularProducts(fresh.slice(0,3)).length,3);
assert.equal(popularProducts([]).length,0);
assert(!ids(popularProducts(catalog)).includes('rtx-5070'));
// Both homepage and catalog use the shared neon card component. On phones
// favorite must be at top-right, and compare directly beneath it (not by cart).
const card=readFileSync('app/catalog-product-card.tsx','utf8');
const actionCss=readFileSync('app/catalog-product-card.css','utf8');
const cardActions=readFileSync('app/card-action-buttons.tsx','utf8');
assert.match(card,/action="favorite"/,'Product card renders the favorite action');
assert.match(card,/action="compare"/,'Product card renders the compare action');
assert.match(card,/<div className="skp-neon-purchase-buttons">/,'Cart button remains in purchase area');
assert.match(actionCss,/@media\(max-width:700px\)\{[\s\S]*?\.card\.skp-neon-card > \.skp-card-actions:not\(\.skp-card-actions-inline\)\{[\s\S]*?position:absolute;[\s\S]*?top:4px;[\s\S]*?right:3px;/,
 'Mobile favorite is anchored at upper-right corner');
assert.match(actionCss,/\.card\.skp-neon-card \.skp-neon-purchase-buttons > \.skp-card-actions-inline\{[\s\S]*?position:absolute;[\s\S]*?top:48px;[\s\S]*?right:3px;/,
 'Mobile compare appears directly under favorite at upper-right');
assert.match(actionCss,/\.card\.skp-neon-card > \.skp-card-actions \.skp-card-action,[\s\S]*?width:44px;[\s\S]*?height:44px;/,
 'Both actions retain accessible 44px mobile tap targets');
assert.match(cardActions,/aria-pressed=\{favorite\}/,'Favorite state remains accessible');
assert.match(cardActions,/aria-pressed=\{compared\}/,'Compare state remains accessible');

console.log('Popular products: preserved selection, deleted-item replacement, stock/price priority, small and empty catalogs passed.');
