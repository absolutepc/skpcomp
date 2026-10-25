# SKP Vercel build — operator checklist

## Current status
Not ready for public deployment. The `vercel-deploy` branch deliberately blocks its build until required migration work is complete.

## Vinext/Nitro Vercel settings
Official Vinext instructions: https://github.com/cloudflare/vinext
- Framework preset: Other
- Root directory: ./
- Build command (once the migration guard passes): `pnpm build:vercel`
- Output directory: `.output`
- Install command: `pnpm install --frozen-lockfile`
- Node version: 22 or newer, matching package.json
- Configure preview builds from `vercel-deploy` before changing production branch.

## Lockfile update (Mac, checked-out vercel-deploy branch)
```sh
git fetch origin
git switch vercel-deploy
git pull --ff-only origin vercel-deploy
corepack enable
corepack pnpm install --lockfile-only
corepack pnpm install --frozen-lockfile
git add pnpm-lock.yaml
git commit -m "chore: synchronize Vercel dependency lockfile"
git push origin vercel-deploy
```
Do not use `--no-frozen-lockfile` as a permanent Vercel deployment workaround.

## Remaining deployment blockers
- Provision a PostgreSQL database and apply the DDL in `db/postgres-schema.sql`.
- Export and migrate catalog and review data from D1. Do not substitute the seed catalog for merchant data.
- Configure Blob and migrate historic R2 media keys; otherwise existing `/api/media?key=...` images break.
- Audit server-only imports and ensure `cloudflare:workers` does not enter the Nitro bundle.
- Ensure all API endpoints, including order handling, work in a Vercel preview environment.
- Set real `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, and `ADMIN_PASSWORD` within Vercel; never commit secrets.

A passing Vite build is necessary but is not sufficient to confirm persistence, auth or image functionality.
