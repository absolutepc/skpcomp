// Dedicated Vercel build entry. The default vite.config.ts remains unchanged.
// Requires: pnpm add -D nitro, and a refreshed pnpm-lock.yaml.
// Do NOT deploy production until scripts/vercel-preflight.mjs passes.
import { defineConfig } from "vite";
import vinext from "vinext";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [
    {
      name: "vercel-cloudflare-binding-guard",
      enforce: "pre",
      resolveId(id) {
        if (id === "cloudflare:workers") return "\0vercel-cloudflare-binding-disabled";
      },
      load(id) {
        if (id === "\0vercel-cloudflare-binding-disabled") {
          return "export const env = new Proxy({}, {get(){throw new Error('Cloudflare bindings are unavailable on Vercel')}});";
        }
      },
    },
    vinext(),
    nitro(),
  ],
});
