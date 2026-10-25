# SKP → Vercel: readiness assessment

Branch: `vercel-deploy`. The production `main` branch remains unchanged.

## Findings from the repository

- `vite.config.ts` always registers `@cloudflare/vite-plugin` and uses a custom Worker entry `build/sites-worker.ts`.
- `db/index.ts` imports `cloudflare:workers` and uses `drizzle-orm/d1` with the `DB` binding.
- `app/api/media/route.ts` imports `cloudflare:workers`, uses the R2 `MEDIA` binding, and stores images there.
- `drizzle.config.ts` specifies the SQLite dialect.
- `scripts/run-framework.mjs` dispatches builds to vinext CLI (or a managed-environment build script).
- `package.json` has no Nitro dependency and requires Node >=22.13.0; its lockfile should be updated alongside any dependency change.
- `lib/local-admin-access.ts` permits passwordless admin **only in local development on localhost**. Production requires configured authentication.

## Required changes BEFORE deploying the actual shop

1. Introduce a platform-aware build: keep Cloudflare's current development setup; add `nitro/vite` for the Vercel build, a pinned Nitro version, a lockfile update and explicit build command. Official Vinext guidance: https://vinext.dev/ and https://github.com/cloudflare/vinext .
2. Move DB access to a provider-independent interface. Provision PostgreSQL and migrate the SQLite/D1 schema and production data carefully; preserve product, variant, order and catalog behavior.
3. Make media storage provider-independent and back it with durable object storage (e.g. Vercel Blob). Ensure existing media URLs or keys can be migrated; do not silently discard product images.
4. Audit all server-side Cloudflare bindings, project-specific connector context, session/auth, and API routes. Never deploy the local passwordless admin behavior publicly.
5. Validate `pnpm install --frozen-lockfile`, Vercel-targeted build, runtime HTTP routes, uploads, persistence across deployments, gallery URLs, order submission, FPS calculator and configurator.

## Deployment gate

**Status: BLOCKED** until provider-specific persistence and runtime integration have been implemented and verified. Successful compilation alone is not proof that the store works.

No production data migration or public deployment has been performed.
