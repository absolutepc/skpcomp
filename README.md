# SKP — магазин компьютеров и комплектующих

Исходники магазина SKP: каталог с категориями и фильтрами, готовые ПК,
конфигуратор, корзина, калькулятор рассрочки и административная панель `/admin`.

Экспорт версии Sites `5fc256ecf4b4ac4f74c1c9a23d262883285d9538`.
Рабочий сайт: https://skp-computers.u-dakaev2016.chatgpt.site

## Установка и сборка

Нужны Node.js >=22.13.0 и pnpm 11.25.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm build
```

Каталог и контакты сохраняются в Cloudflare D1 (binding `DB`).
Для административной панели настройте секрет `ADMIN_PASSWORD` в среде запуска.

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
