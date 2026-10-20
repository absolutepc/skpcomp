# SKP — магазин компьютеров и комплектующих

Исходники магазина SKP: каталог с категориями и фильтрами, готовые ПК,
конфигуратор, корзина, калькулятор рассрочки и административная панель `/admin`.

Экспорт версии Sites `5fc256ecf4b4ac4f74c1c9a23d262883285d9538`.
Рабочий сайт: https://skp-computers.u-dakaev2016.chatgpt.site

## 3D-конфигуратор — отложенный прототип

**Основной конфигуратор `/configurator` восстановлен в прежнем виде.**
Техническая 3D-сцена временно **отключена от сайта**: она больше не
импортируется в `app/build-pages.tsx`, а её стили удалены из `app/globals.css`.

Файлы сохранены для будущего подключения:
- `app/assembly-preview.tsx` — параметрическая SVG-сцена с камерой и анимацией установки деталей;
- `app/assembly-preview.css` — отдельные стили сцены, не подключённые к текущему сайту.

Для включения в будущем понадобится импортировать `AssemblyPreview` в
`app/build-pages.tsx` и отобразить компонент внутри конфигуратора.
Отдельно можно заменить SVG-проекцию поддержкой настоящих GLB-моделей через
Three.js. Ничего из 3D-сцены сейчас не меняет каталог, корзину или фильтры.

## Адрес магазина SKP

Контакты и карта доступны на странице `/contacts`. Указан адрес:
**г. Грозный, ул. Нурсултана Назарбаева, 117/7**.
Координаты из Яндекс Карт: **43.339259, 45.700568**.
На странице используется интерактивная карта Яндекса (iframe, загружается
с внешнего сайта), кнопка построения автомобильного маршрута в Яндекс Картах
и ссылка для открытия точки в 2ГИС. При недоступности встроенной карты
посетитель может воспользоваться ссылкой на отдельную карту.
Адрес отображается и в подвале сайта; ссылка «Контакты» добавлена в меню.

Компонент `app/store-location.tsx` содержит адрес, координаты и ссылки.
Каталог товаров, D1 и настройки Instagram/WhatsApp не изменяются.

## Установка и сборка

Нужны Node.js >=22.13.0 и pnpm 11.25.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm build
```

Каталог и контакты сохраняются в Cloudflare D1 (binding `DB`).
Для административной панели настройте секрет `ADMIN_PASSWORD` в среде запуска.

### Сравнение, игровые FPS и отзывы

**Сравнение:** из карточки товара, страницы товара или списка готовых ПК нажми
«Сравнить». Одновременно можно выбрать до четырёх товаров одной категории;
смешивать категории нельзя. Выбор сохраняется в `localStorage` браузера.
На странице `/compare` доступны таблица общих характеристик,
режим «Только различия» и удаление из сравнения.

**Продвинутый FPS-калькулятор:** карточки готовых ПК, подробная страница ПК и
`/configurator` показывают оценки для 10 игр. Настройки переключаются
независимо в каждом блоке: разрешение FHD (1920×1080), 2K (2560×1440),
4K (3840×2160); пресеты **Низкие / Средние / Высокие / Ультра**;
**трассировка лучей (RT)**; **нативное разрешение / DLSS / FSR** с вариантами
качества **Качество / Баланс / Производительность**.

Функции учитываются только для тех игр, где они поддерживаются моделью:
RT — Cyberpunk 2077 и War Thunder; масштабирование — по перечню в
`lib/fps-estimate.ts`. В строке игры видно, применился ли выбранный режим;
знак «—» означает, что режим не рассчитывался. Выбор DLSS доступен только
при видеокарте GeForce RTX. Генерация кадров (Frame Generation) не включена.

**Все цифры — условная математическая оценка**, а не результаты измерений
данного ПК, и узкий диапазон FPS **не является доверительным интервалом**.
Модель учитывает упрощённые относительные классы GPU/CPU и условное влияние
настроек; производительность конкретной игры зависит от версии,
сценария, загрузки CPU, VRAM, охлаждения, драйверов и других факторов.
При неизвестных CPU или GPU расчёт не показывается. Проверка модели:
`pnpm test:fps`. Проверка сайта: `pnpm build`. При появлении надёжных
бенчмарков следует заменить базовые игровые профили на измерения.

Источники для учёта **наличия функций**, а не точных значений FPS:
[Cyberpunk 2077 — CDPR](https://support.cdprojektred.com/en/cyberpunk/pc/sp-technical/issue/2383/path-tracing-overdrive-mode-requirements-how-to),
[War Thunder — официальный сайт](https://warthunder.com/en/news/9453-development-ray-tracing-keeps-improving-en),
[Battlefield 6 — EA FAQ](https://www.ea.com/games/battlefield/battlefield-6/faq),
[Rust DLSS — Facepunch](https://rust.facepunch.com/news/wounding-and-voice-props).


**Отзывы:** на каждой странице товара посетитель может отправить
оценку 1–5, имя и текст. Отзывы хранятся в Cloudflare D1 в отдельной
таблице `product_reviews` (создаётся при первом обращении к API),
новые получают статус `pending`. В `/admin` владелец публикует или
отклоняет отзывы; до одобрения они не отображаются публично.
Применяются проверка формы, защита от частого отправления и простая
ловушка для ботов. Отзывы пока не подтверждаются покупкой.
Для работы API необходим рабочий D1 binding `DB`.

### Комплектация готовых ПК

В админ-панели `/admin` открой товар из категории **«Готовые ПК»** (или создай такой товар).
Появится раздел **«Комплектация готового ПК»**: отдельные поля для процессора,
материнской платы, видеокарты, ОЗУ, основного и дополнительного накопителя,
блока питания, охлаждения, корпуса, вентиляторов, беспроводной связи и ОС.
Кнопка **«Добавить компонент»** позволяет ввести дополнительные детали с
собственным названием и моделью. Незаполненные поля скрыты на сайте.

После «Сохранить товар» комплектация хранится в существующей базе D1 вместе с
товаром (поля `buildComponents` и `buildExtras`). На странице готового ПК
отображается короткий состав, на странице конкретного товара — все заполненные
строки внутри «Характеристик». Действующие сборки и данные других категорий
не заполняются вымышленными деталями; их состав нужно указать в админке.

### Цветовые варианты товаров

Каждый цвет — отдельный товар с собственным ID, URL, фото, ценой и наличием.
Чтобы связать их на странице товара, укажите одинаковое значение
`variantGroup` в редакторе товара и цвет в его характеристиках (например,
«Белый» и «Чёрный»). Поле `colorHex` задаёт цвет круглого образца.
В админ-панели они называются «Группа цветовых вариантов» и «Цвет переключателя».

Добавлены Logitech G PRO X Superlight 2: белая мышь использует ID `mouse`,
чёрная — `logitech-pro-x-superlight-2-black`. Для белой модели сохранена
ранее указанная в каталоге цена 13 900 ₽; для чёрной цена и наличие пока
требуют уточнения у магазина. Цена 0 в базе обозначает «Цена по запросу»:
такой товар нельзя положить в корзину до указания стоимости, но можно
запросить цену в WhatsApp, если контакт магазина заполнен.

### Logitech G PRO X2 / X3 LIGHTSPEED (версия каталога 6)

В разделе «Периферия → Наушники» добавлено 6 отдельных товарных карточек:
PRO X2 LIGHTSPEED (Black, White, Magenta) и PRO X3 LIGHTSPEED
(Black, White, Magenta). Отдельный ID, отдельный URL, собственные
характеристики и изображение каждого цвета. В рамках одного поколения цвета
соединены группами `logitech-pro-x2-lightspeed` и
`logitech-pro-x3-lightspeed`, поэтому переключаются на странице товара.

Изображения расположены локально в
`public/products/headphones/logitech-pro-*-lightspeed-*.svg`.
Это **стилизованные векторные иллюстрации без фона, не фотографии**.
Они не зависят от внешних ссылок; когда будут готовы предметные фотографии,
их можно заменить через админ-панель.

На момент добавления не указаны цены и наличие; все шесть товаров имеют
цену 0 («Цена по запросу») и не могут быть заказаны через корзину, пока
владелец магазина не задаст стоимость. Добавлены поля для фильтрации
по диаметру драйверов и времени работы от аккумулятора.
Переход на `catalogVersion:6` подхватывает товары и в уже созданной D1,
не сбрасывая прочие товары, контакты, цены и фотографии.

### Процессоры: изображения без фона (версия каталога 5)

Пять карточек CPU теперь используют локальные прозрачные SVG-иллюстрации
под маркировки своих моделей: `/products/cpu/*.svg`. В отличие от ранее
использовавшихся внешних фотографий, файлы лежат в репозитории, не зависят
от сторонних CDN и не содержат белой подложки. Это стилизованные
векторные изображения процессоров, **не фотографии**. Настоящие предметные
фотографии с прозрачным фоном можно загрузить отдельно, когда будут
подготовлены оригиналы.

Обновлены Ryzen 5 7500F, Intel Core i5-13400F, Ryzen 5 7500X3D,
Ryzen 7 7800X3D, Ryzen 7 9800X3D. API разрешает локальные
`/products/cpu/*.svg` в настройке фотографий и обновляет старые
пути во время миграции `catalogVersion:5`, не меняя пользовательские
фотографии и цены.

### AMD Ryzen X3D (версия каталога 4)

В разделе «Комплектующие → Процессоры» добавлены три независимых товара:
`ryzen-5-7500x3d`, `ryzen-7-7800x3d` и `ryzen-7-9800x3d`.
Все поддерживают AM5 / DDR5, L3-кэш 96 МБ. Ryzen 5 7500X3D имеет
6 ядер / 12 потоков, 4,0–4,5 ГГц, TDP 65 Вт (Zen 4).
Ryzen 7 7800X3D — 8 / 16, 4,2–5,0 ГГц, TDP 120 Вт (Zen 4).
Ryzen 7 9800X3D — 8 / 16, 4,7–5,2 ГГц, TDP 120 Вт (Zen 5).
Добавлены фильтры по архитектуре и частоте Boost.
Изображения взяты из сторонних карточек соответствующих товаров; они
загружаются по HTTPS и могут потребовать замены на собственные изображения.
Цена и наличие намеренно не указаны: установите их через админ-панель.
D1-записи с `catalogVersion<4` автоматически получают недостающие модели
без перезаписи существующих записей, контактов, цен или остатков. После
сохранения в админ-панели обновление фиксируется как версия 4.

### Изображения Logitech без белого фона (версия каталога 3)

У всех пяти Logitech (два PRO X SUPERLIGHT 2, один PRO X2 SUPERSTRIKE и два PRO X3 SUPERSTRIKE)
проставлены оригинальные PNG-изображения производителя с прозрачным фоном
из `resource.logitechg.com`. Удалён принудительный белый фон
`.variant-visual`; на страницах магазина мышки теперь отображаются на фоне темы сайта.
Для PRO X2 SUPERSTRIKE из названия и описания удалены слова о чёрных кнопках;
цвет характеристики изменён на «Белый».

Версия 3 аккуратно обновляет товары в уже созданной D1-базе:
ранее заданные магазином собственные изображения и названия остаются,
старые штатные ссылки автоматически заменяются на прозрачные,
цены, наличие, дополнительные товары и контакты не затрагиваются.
После нового сохранения в админ-панели `catalogVersion:3` фиксирует миграцию.

### SUPERSTRIKE (версия каталога 2)

Добавлены три самостоятельных товара из подраздела «Мышки»:

- `logitech-pro-x2-superstrike` — PRO X2 SUPERSTRIKE Lunar Eclipse (белый корпус, чёрные кнопки), единственный цвет, без переключателя.
- `logitech-pro-x3-superstrike-black` — PRO X3 SUPERSTRIKE, чёрный.
- `logitech-pro-x3-superstrike-pink` — PRO X3 SUPERSTRIKE, розовый.

Два цвета X3 связаны по группе `logitech-pro-x3-superstrike` и ведут друг на друга через цветовые кнопки. Каждая мышь имеет отдельную страницу и фотографию из открытого каталога стороннего продавца. Фотографии пока загружаются по внешним HTTPS-адресам и могут требовать замены на собственные файлы при переносе на постоянный хостинг. Обе цены и наличие X3, а также цена и наличие X2 не установлены: до заполнения в админ-панели они отображаются как «Цена по запросу» и недоступны для заказа через корзину.

D1-записи с `catalogVersion=1` получают эти три позиции при загрузке без изменения существующих товаров и контактов. После сохранения версии 2 вручную удалённые модели не будут возвращаться автоматически.

Старые данные D1 автоматически получают новые варианты при первой загрузке
через `/api/store` без перезаписи других товаров, контактов и цен.
При следующем сохранении через админ-панель `catalogVersion` фиксирует
обновление, поэтому сознательно удалённые варианты не возвращаются.

Пароль и содержимое рабочей базы данных в репозиторий не включены.
Для локального запуска задайте пароль в `.dev.vars` и примените миграцию
`drizzle/0000_hard_barracuda.sql`, как описано ниже.

Текущая конфигурация подготовлена для Sites / Cloudflare Workers.
Выгрузка на GitHub сама по себе не переносит сайт на другой хостинг.

## Документация базового проекта

A clean full-stack starter running on [vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`
- Portable: Windows, macOS, or Linux; no Bash required
- Managed Linux: managed Linux runtime with Bash, `flock`, `curl`, `sha256sum`, and GNU `timeout`
- Git is required only for publishing

## Sites Lifecycle

The Sites initializer copies the shared starter and selects managed-linux only when `SITES_MANAGED_LINUX_CONTAINER=1`; otherwise it selects portable. It saves the selection only in ignored `.sites-runtime/execution-profile.json`. Both profiles copy/configure first, then use the plugin's separate `install-dependencies.mjs` step to measure installation independently. Edit source under `app/` and follow the Sites skill for installation, preview, builds, and publishing.

Run `node <plugin-root>/scripts/configure-execution-profile.mjs` only when the profile is unknown for the current checkout and environment. Profile changes do not alter tracked source or require reinstalling otherwise-valid dependencies; restart an existing preview to use the new selection. Do not commit or upload `.sites-runtime/`.

This starter does not use `wrangler.jsonc`.

`install:ci` runs `npm ci` once against the shared lockfile, disables parent-workspace discovery, and includes required dev/optional dependencies despite production/omit settings. Sharp defaults to prebuilt binaries unless explicitly configured otherwise. Do not overlap installers.

- **Portable:** Preserve host HOME, npm cache, registry, proxy, temporary paths, retry/concurrency settings, and lifecycle-script policy. Use `--prefer-offline --no-audit --no-fund`.
- **Managed Linux:** Use the existing project-local HOME/cache/tmp setup and Linux install lock, tarball preflight, and timeout. Restore the image-seeded npm cache only when its lockfile hash matches; retain network fallback. Builds keep their existing timeout. These helpers are not invoked by the portable profile.

`scripts/sites-env.mjs` preserves the caller's HOME, npm cache, proxy, XDG, and temporary-directory configuration while defaulting Wrangler and Miniflare state to the checkout. If npm reports an unwritable cache, select a writable path with `npm_config_cache` for that install. The `dev` and `start` scripts also keep Wrangler logs inside the checkout. Generated `.sites-runtime/` and `.wrangler/` directories are disposable and ignored by Git.

On portable, `npm run dev` uses `vinext dev` with HMR, starting at port 5173. Vinext records the running server in ignored `.vinext/` state, rejects an ordinary duplicate launch, and recovers stale state after a stopped process; exactly simultaneous starts can race. Pass `--port <port>` or `--hostname <host>` after `npm run dev --` when needed; keep portable previews on loopback.

For browser QA on managed Linux, use `sites-preview start`. The project's dev script runs Vite and accepts the supervisor's `--host 0.0.0.0 --port 4173 --strictPort` arguments. The internal browser uses `http://terminal.local:4173/`; it is not a user-facing URL. The supervisor owns the preview lifecycle. The ignored local profile survives the supervisor's cleared process environment.

The portable profile simulates ChatGPT sign-in only for loopback development requests. Visit `/signin-with-chatgpt?return_to=/` to sign in as `local_seedy` (`seedy@sites.test`, display name `Seedy`) and `/signout-with-chatgpt?return_to=/` to sign out. The development cookie preserves that identity across server restarts. Mock auth is disabled in the managed-linux profile and is not included in production builds; hosted authentication remains dispatch-owned.

The Worker uses `vinext/server/fetch-handler`, including Vinext's config-aware image handling. After building, `npm start` runs that Worker locally through Wrangler on `127.0.0.1`, sharing `.wrangler/state` with dev preview and local D1 migrations; it does not deploy the site or simulate sign-in. Use the URL printed by the server. Pass `npm start -- --port <port>` to select a different built-preview port.

Local previews use Miniflare's placeholder `Request.cf` metadata without a network lookup. Set `CLOUDFLARE_CF_FETCH_ENABLED=true` to opt into fetching preview metadata; this setting does not change hosted request metadata.

Local tool usage metrics are disabled by default. Set `WRANGLER_SEND_METRICS=true` to opt in.

## Included Shape

- edit site code under `app/`
- `app/chatgpt-auth.ts` provides optional dispatch-owned ChatGPT sign-in helpers
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/index.ts` reads the D1 binding from the Cloudflare Worker environment
- `db/schema.ts` starts intentionally empty
- `@cloudflare/workers-types` provides Worker types; `cloudflare-env.d.ts` declares optional `DB`/`BUCKET` bindings—update these declarations if binding names change
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

Signed-in visitors receive both `oai-authenticated-user-id` and `oai-authenticated-user-email`. Private Sites require every visitor to sign in; public Sites may also have anonymous visitors, for whom neither header is present.

The user ID is stable for the same user on the same Site and different across Sites. Use it as the durable user key; use email and name for display or contact purposes.

SIWC-authenticated workspace sites may also receive `oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty `name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by `oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const userId = requestHeaders.get("oai-authenticated-user-id");
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use the returned `userId` as the stable user key for user-owned records; do not use email as a durable identifier.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send anonymous visitors through Sign in with ChatGPT.
- In a Server Component, start sign-in with `<a href={chatGPTSignInPath(returnTo)} target="_top">`. The auth helper module is server-only; do not import it into a Client Component.
- Do not use `fetch`, XHR, a client-side router, or a framework link that can prefetch the sign-in route. SIWC must start as a top-level navigation.
- Never request the AuthAPI authorization endpoint directly. The dispatch-owned `/signin-with-chatgpt` route must start the SIWC flow.
- Use `chatGPTSignOutPath(returnTo)` for browser sign-out links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the OAuth cookies, and identity header injection. Do not implement app routes for those reserved paths. Routes that do not import and call the helper remain anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the Sites hosting platform's access policy controls for workspace-wide restrictions, or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write actions tied to the current ChatGPT user. Leave public content anonymous.

## Local D1 migrations

For a D1-backed local preview, generate SQL with `npm run db:generate`. Build once through the Sites skill's build entrypoint (or `npm run build` for standalone use) to generate `dist/server/wrangler.json`, rebuilding if bindings change. From the project root, apply each pending migration in order:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_example.sql
```

Replace the filename with the pending migration and `DB` with your D1 binding name if different. Use `.wrangler/state`, not `.wrangler/state/v3`; Wrangler adds the versioned directories. Do not replay migrations already applied locally. This updates only the preview database; publishing applies production migrations separately.

## Diagnostic Commands

- `npm run install:ci`: perform the one locked dependency install
- `npm run dev`: start the Vite/Vinext development server
- `npm run build`: build the deployable Sites artifact
- `npm run start`: preview the built Worker locally with D1/R2 support
- `npm run db:generate`: generate Drizzle migrations after schema changes

When using the Sites plugin, follow its skill instructions for installation, builds, and publishing. These npm commands remain available for standalone use.

The portable build runs Vinext directly without a host `timeout` command. The managed-linux build uses `scripts/build-verified.sh` and its existing `SITES_BUILD_TIMEOUT` setting.

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
