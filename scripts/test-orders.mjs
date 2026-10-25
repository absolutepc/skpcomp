import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

function load(name,deps={}){
 const source=readFileSync(new URL('../'+name,import.meta.url),'utf8');
 const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true});
 assert.equal((output.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error).length,0);
 const exports={};
 runInNewContext(output.outputText,{exports,require:key=>deps[key]||{},Map,Set,Array,Number,String,JSON,Error,Date,Math});
 return exports;
}
const {seed}=load('lib/seed.ts');
const customBuild=load('lib/custom-build-cart.ts');
const orders=load('lib/orders.ts',{'./custom-build-cart':customBuild});
const {normalizeOrderItems,validateContact,ORDER_LABELS,ORDER_TRANSITIONS,canTransition,isOrderStatus,groupCart,parseOrderKeys,rememberOrder,ORDER_HISTORY_STORAGE}=orders;
assert.deepEqual(Object.values(ORDER_LABELS),['В процессе','Собран','Отменён','Выполнен']);
assert.equal(canTransition('processing','assembled'),true);
assert.equal(canTransition('processing','cancelled'),true);
assert.equal(canTransition('assembled','completed'),true);
assert.equal(canTransition('assembled','cancelled'),true);
for(const state of ['completed','cancelled'])for(const next of Object.keys(ORDER_LABELS))assert.equal(canTransition(state,next),false);
assert.equal(canTransition('processing','completed'),false,'Cannot complete before assembly');
assert.equal(isOrderStatus('assembled'),true);
assert.equal(isOrderStatus('refunded'),false);
assert.equal(ORDER_HISTORY_STORAGE,'skp-order-history-v1');
const gpu=seed.products.find(p=>p.id==='rtx-5070');
assert.ok(gpu?.price>0);
const lines=normalizeOrderItems([{id:gpu.id,quantity:2}],seed.products);
assert.equal(lines[0].productId,gpu.id);
assert.equal(lines[0].unitPrice,gpu.price);
assert.equal(lines[0].subtotal,gpu.price*2);
assert.equal(lines[0].quantity,2);
assert.throws(()=>normalizeOrderItems([],seed.products));
assert.throws(()=>normalizeOrderItems([{id:gpu.id,quantity:2},{id:gpu.id,quantity:1}],seed.products),'Reject duplicate cart entries');
assert.throws(()=>normalizeOrderItems([{id:gpu.id,quantity:21}],seed.products),'Reject excessive quantities');
assert.throws(()=>normalizeOrderItems([{id:'missing-id',quantity:1}],seed.products));
assert.throws(()=>normalizeOrderItems([{id:'ryzen-5-7500x3d',quantity:1}],seed.products),'Unpriced products cannot be ordered');
// Custom PC: a complete configuration is one line, with prices resolved from catalog.
const slots=['cpu','motherboard','ram','gpu','ssd','psu','case','cooler'];
const selection=Object.fromEntries(slots.map(slot=>{
 const product=seed.products.find(p=>p.category===slot&&p.price>0);
 assert.ok(product,'Need priced '+slot);
 return [slot,product.id];
}));
selection.os='windows-11';
const build={type:'custom-build',id:'build-12345678-1234-4234-8234-123456789abc',selected:selection};
const cartRows=customBuild.summarizeCart([build],seed.products);
assert.equal(cartRows.length,1);
assert.equal(cartRows[0].valid,true);
assert.equal(cartRows[0].assemblyFee,3000);
assert.equal(cartRows[0].details.length,8);
assert.equal(cartRows[0].os,'Windows 11');
const builtOrder=normalizeOrderItems([build],seed.products);
assert.equal(builtOrder.length,1,'One configured PC becomes one order line');
assert.equal(builtOrder[0].unitPrice,cartRows[0].price);
assert.equal(builtOrder[0].assemblyFee,3000);
assert.equal(builtOrder[0].components.length,8);
assert.equal(normalizeOrderItems([{...build,price:1,subtotal:1}],seed.products)[0].subtotal,cartRows[0].price,
 'Client cannot override build total');
assert.throws(()=>normalizeOrderItems([{...build,selected:{...selection,cpu:'no-such-cpu'}}],seed.products),
 'Reject incomplete or invalid custom PC');
assert.throws(()=>normalizeOrderItems([{...build,selected:{...selection,os:'malicious-os'}}],seed.products),
 'Reject invalid OS');
assert.throws(()=>normalizeOrderItems([build,build],seed.products),'Reject duplicate build IDs');
const augmented=customBuild.summarizeCart([gpu.id,build,gpu.id],seed.products);
assert.equal(augmented.length,2,'Traditional cart items and one custom PC coexist');
assert.equal(customBuild.cartGrandTotal(augmented),cartRows[0].price+gpu.price*2);
assert.equal(customBuild.cleanCart([gpu.id,build]).length,2,'Cart survives JSON storage');
const modified=seed.products.map(p=>p.id===gpu.id?{...p,price:20}:p);
assert.equal(normalizeOrderItems([{id:gpu.id,quantity:1,unitPrice:1}],modified)[0].unitPrice,20,'Ignore client-supplied pricing');
assert.equal(validateContact('Иван Иванов','+7 999 123-45-67','Позвоните вечером').customerName,'Иван Иванов');
assert.throws(()=>validateContact('A','+7 999 123-45-67',''));
assert.throws(()=>validateContact('Иван','test',''));
assert.throws(()=>validateContact('Иван','+7 999 123-45-67','x'.repeat(501)));
assert.equal(groupCart(['abc','abc','def']).find(row=>row.id==='abc')?.quantity,2);
const key={id:'12345678-1234-4234-8234-123456789abc',accessKey:'f'.repeat(64),number:'SKP-261021-ABCDEF12',createdAt:'2026-10-21 12:30:00'};
assert.equal(parseOrderKeys(JSON.stringify([key]))[0].id,key.id);
assert.equal(rememberOrder(JSON.stringify([key]),key).length,1,'Already saved orders are de-duplicated');
assert.equal(parseOrderKeys(JSON.stringify([{id:key.id,accessKey:'bad',number:key.number}])).length,0);
assert.equal(parseOrderKeys('{bad').length,0);
const route=readFileSync(new URL('../app/api/orders/route.ts',import.meta.url),'utf8');
assert.match(route,/CREATE TABLE IF NOT EXISTS skp_orders/);
assert.match(route,/CREATE TABLE IF NOT EXISTS skp_order_events/);
assert.match(route,/getCatalog\(\)/,'Order item snapshots use current server-side prices');
assert.match(route,/id=\? AND access_hash=\?/,'Public order lookup uses secret access key hash');
assert.match(route,/adminAuth\(request\)/,'Admin endpoint requires authentication');
assert.match(route,/canTransition\(current\.status,input\.status\)/,'Status transitions are validated server-side');
assert.match(route,/INSERT INTO skp_order_events/,'Status transitions recorded');
assert.match(route,/originMatches\(request\)/,'Mutating requests validate origin');
const ui=readFileSync(new URL('../app/shop.tsx',import.meta.url),'utf8');
assert.match(ui,/path==='\/checkout'\?<Checkout/);
assert.match(ui,/path==='\/orders'\?<OrderHistory/);
assert.match(ui,/<AdminOrders products=\{data\.products\}\/>/,'Admin orders receive product images for mobile lists');
assert.match(ui,/Обсудить заказ <MessageCircle/,'Existing WhatsApp option preserved');
// Cart displays an explicit right-aligned total for each ordinary product and
// each single-line configured PC; duplicate quantities use the extended price.
assert.match(ui,/<strong className="skp-cart-line-price">\{money\(row.price\*row.quantity\)\}<\/strong>/,
 'Ordinary product line uses quantity-adjusted total');
assert.match(ui,/<strong className="skp-cart-line-price">\{money\(row.price\)\}<\/strong>/,
 'Custom PC line displays its bundled total');
assert.match(ui,/className="sum skp-cart-order-total"/,'Cart summary uses prominent total styling');
const cartStyles=readFileSync(new URL('../app/custom-build-cart.css',import.meta.url),'utf8');
assert.match(cartStyles,/\.skp-cart-page \.skp-cart-line-price\{/,'Product prices are styled separately');
assert.match(cartStyles,/color:#ffe500;text-align:right/,'Cart summary total is yellow and aligned right');
assert.match(cartStyles,/align-items:flex-end/,'Cart amount column is aligned right');
const buyer=readFileSync(new URL('../app/orders.tsx',import.meta.url),'utf8');
assert.match(buyer,/ORDER_HISTORY_STORAGE/);
assert.match(buyer,/Оформить заявку/);
assert.match(buyer,/История заказов/);
assert.match(buyer,/Отменить заказ/);
console.log('Order tests passed: valid workflow, snapshots, contact validation, secure history and SKP integrations.');
