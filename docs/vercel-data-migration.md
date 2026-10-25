# Vercel data migration plan (SKP)

## Current D1 schema
`db/schema.ts` has two tables: `shop(id, value)` (JSON/text snapshots in the `value` column), and `product_reviews`. The existing `db/index.ts` imports `cloudflare:workers` and uses `drizzle-orm/d1`. `app/api/reviews/route.ts` also uses D1 SQL directly, including SQLite-only `datetime('now', '-24 hours')` syntax.

## PostgreSQL target
`db/postgres-schema.sql` describes the target schema. It is not executed automatically and contains **no data**. Preserve existing `shop.value` text unmodified until all consumers have been audited. Never treat a newly-created empty database as a migration.

### Review query portability
- D1 `? ` positional binds must become parameterized PostgreSQL `$1`, `$2`, ...
- D1 `datetime('now','-24 hours')` must become a portable timestamp comparison (e.g. `created_at::timestamp > now() - interval '24 hours'` for the current TEXT schema).
- Current review rows store their `created_at` values as TEXT; migration must normalize/validate UTC semantics before changing column type.
- The D1 `prepare().bind().all()/first()/run()` API is not a PostgreSQL API. Port every call site or introduce a compatibility interface after enumerating it.

## Media
`app/api/media/route.ts` currently uses Cloudflare R2 and supports files up to 8 MB. Vercel Functions have a 4.5 MB request body limit. Do not replace R2 with server-side Vercel Blob `put()` for all uploads: files over the limit need **client-side upload** with a securely validated token exchange, or a lower product limit agreed with the shop owner.

Images referenced as `/api/media?key=products/...` must continue resolving after migration. Migration requires copying existing R2 objects and preserving/redirecting their keys.

## Security gate
- Never publish before `ADMIN_PASSWORD` is set on the deployment environment and login flow is verified.
- Do not commit database passwords or Blob tokens.
- Do not drop, rewrite, or replace the existing D1 database until content and media backups are verified.
- The isolated `vercel-deploy` branch is not production ready.
