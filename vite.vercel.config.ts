// Dedicated Vercel build entry. The default vite.config.ts remains unchanged.
// Requires: pnpm add -D nitro, and a refreshed pnpm-lock.yaml.
// Do NOT deploy production until scripts/vercel-preflight.mjs passes.
import { defineConfig } from "vite";
import vinext from "vinext";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [vinext(), nitro()],
});
