#!/usr/bin/env node
/**
 * Deployment guard for the SKP Vercel migration.
 * Failure is intentional: deploying before migrating D1/R2 risks broken
 * administration and lost or inaccessible product photos.
 * Run from the repository root: node scripts/vercel-preflight.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");
const checks = [
  ["Vercel Vite config exists", () => existsSync(join(root, "vite.vercel.config.ts"))],
  ["Nitro dependency declared", () => Boolean(JSON.parse(read("package.json")).devDependencies?.nitro)],
  ["Dependency lockfile synchronized", () => { const lock = read("pnpm-lock.yaml"); return ["nitro:", "pg:", "'@vercel/blob':"].every(name => lock.includes(name)); }],
  ["PostgreSQL store route is wired", () => read("app/api/store/route.ts").includes("storeEnv()") && read("app/api/reviews/route.ts").includes("storeEnv()")],
  ["Orders route uses platform storage", () => read("app/api/orders/route.ts").includes("storeEnv()")],
  ["Media routes do not require Cloudflare R2", () => !/cloudflare:workers|R2Bucket|E\.MEDIA/.test(read("app/api/media/route.ts"))],
  ["Production admin requires a password", () => {
    const source = read("lib/local-admin-access.ts");
    return source.includes("NODE_ENV!=='development'") && source.includes("localhost");
  }],
];
let failures = 0;
for (const [name, test] of checks) {
  let ok = false;
  try { ok = Boolean(test()); } catch (error) { console.error(error.message); }
  console.log(`${ok ? "PASS" : "BLOCK"} ${name}`);
  if (!ok) failures++;
}
console.log(`\n${failures ? `${failures} issue(s) blocking Vercel deployment.` : "Static checks passed. Run build and end-to-end tests before deploying."}`);
if (failures) process.exitCode = 1;
