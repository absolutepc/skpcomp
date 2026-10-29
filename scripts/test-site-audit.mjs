/**
 * Whole-site source contract audit. Complements feature unit tests and the
 * production build; it does NOT replace desktop/mobile browser QA.
 */
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const source=(name)=>readFileSync(path.join(root,name),'utf8');
const shop=source('app/shop.tsx');
const detail=source('app/product-detail-page.tsx');
const catalog=source('app/catalog-page.tsx');
const ready=source('app/build-pages.tsx');
const orders=source('app/orders.tsx');
const storeSearch=source('app/store-search.tsx');
const admin=source('app/admin-sidebar.tsx');
const colors=source('app/admin-dark-theme.css');
const storeAPI=source('app/api/store/route.ts');
const ordersAPI=source('app/api/orders/route.ts');
const mediaAPI=source('app/api/media/route.ts');
const reviewAPI=source('app/api/reviews/route.ts');
const components={
 'Главная страница':shop.includes('<HeroSlider nav={nav}')&&shop.includes('popularProducts(data.products)'),
 'Каталог':shop.includes('<CatalogPage')&&catalog.includes('matchesFilters(p,facets'),
 'Страница товара':shop.includes('<ProductDetailPage')&&detail.includes('skp-pdp-tabs'),
 'Избранное':shop.includes("path==='/favorites'")&&shop.includes("localStorage.setItem('skp-favorites'"),
 'Сравнение':shop.includes('<ComparePage')&&shop.includes('comparisonCategory(all[0])!==comparisonCategory(p)'),
 'Корзина':shop.includes("path==='/cart'")&&shop.includes('summarizeCart(cart,data.products)'),
 'Заказы':shop.includes('<Checkout')&&shop.includes('<OrderHistory')&&orders.includes("action:'create'")&&ordersAPI.includes('normalizeOrderItems(input.items,catalog.products)'),
 'Готовые ПК':shop.includes('<ReadyPC')&&ready.includes('export function ReadyPC'),
 'Конфигуратор':shop.includes('<Configurator')&&ready.includes('BuildDiagnostics'),
 'Контакты':shop.includes('<StoreLocation')||shop.includes("path==='/contacts'"),
 'Поиск':shop.includes('<StoreSearch')&&storeSearch.includes('role="dialog"'),
 'Админ-панель':shop.includes('<AdminSidebar')&&admin.includes('ADMIN_SECTIONS.map'),
 'Бренды':shop.includes('<AdminBrands')&&admin.includes("id:'brands'"),
 'Слайды':shop.includes('<AdminHeroSlides')&&admin.includes("id:'slides'"),
 'FPS-калькулятор':detail.includes('<GamingFps')&&shop.includes('fpsGames'),
 'Отзывы':detail.includes('<ProductReviews')&&reviewAPI.includes("status='approved'"),
 'Галерея':shop.includes('<AdminProductMedia')&&mediaAPI.includes('E.MEDIA.put('),
 'Рассрочка':shop.includes('<Installments')||shop.includes("path==='/installments'")
};
for(const [section,ok] of Object.entries(components))assert(ok,'Missing key section/workflow: '+section);
assert(shop.includes('aria-expanded={menu}')&&shop.includes('aria-controls="skp-main-navigation"'),'Mobile menu must expose its state');
assert(shop.includes('<span className="visually-hidden">Избранное</span>'),'Favorite icon link needs an accessible label');
assert(shop.includes('<span className="visually-hidden">Корзина</span>'),'Cart icon link needs an accessible label');
assert(detail.includes('p.description'),'Product description is available in details');
assert(!ready.includes('<p className="component-desc">{p.description}</p>'),'Configurator hides part description on all breakpoints');
assert(colors.includes('--skp-admin-bg:#000;'),'Admin uses the shared black palette on all screen sizes');
assert(colors.includes('.skp-admin-topbar > .skp-admin-global-search:not(.mobile-expanded)'),'Mobile admin search stays hidden until opened');
assert(storeAPI.includes('maxProductSpecFields('),'API accepts fully populated monitor specifications');
assert(storeAPI.includes("if(!await auth(r))"),'Catalog changes require admin authorization');
assert(ordersAPI.includes("SELECT * FROM skp_orders"),'Orders can be retrieved by admin');
assert(ordersAPI.includes("access_hash=?"),'Customer order lookup requires access key');
assert(ordersAPI.includes('const total=orderTotal(items)'),'Order totals are calculated on the server');
assert(mediaAPI.includes('gameProfiles.some(game=>game.id===assetId)'),'FPS media uploads restrict game IDs');
assert(mediaAPI.includes('FPS_MEDIA_KEY'),'FPS cover URLs have a dedicated R2 namespace');
assert(reviewAPI.includes("status='pending'"),'Reviews are moderated before publication');
for(const [label,file] of [
 ['Logo','public/images/skp-logo.jpg'],
 ['PC category','public/images/category-components.webp'],
 ['Laptops category','public/images/category-laptops.jpg'],
 ['Peripherals category','public/images/category-peripherals.jpg'],
 ['Furniture category','public/images/category-furniture.jpg'],
 ['Valorant cover','public/images/fps-games/valorant.png'],
 ['Battlefield cover','public/images/fps-games/battlefield6.png']
])assert(existsSync(path.join(root,file)),'Missing important image: '+label+' ('+file+')');
const responsiveFiles=['app/globals.css','app/catalog-product-card.css','app/product-detail-page.css','app/admin-mobile.css','app/ready-pc-mobile.css','app/compare-page.css','app/fps-calculator-v2.css'];
for(const file of responsiveFiles)assert(/@media\s*\(max-width:\s*(?:700|760|768|850)px\)/.test(source(file)),'No mobile breakpoint found: '+file);
console.log('Source audit passed: '+Object.keys(components).length+' site areas, assets, access control, UX and mobile CSS contracts.');
