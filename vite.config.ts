// Build para Vercel: desliga o plugin do Cloudflare e usa o Nitro (preset vercel).
// O deploy no Cloudflare Workers continua disponivel via wrangler.jsonc/GitHub Actions
// (ver build:cloudflare em package.json).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

const target = process.env.DEPLOY_TARGET ?? (process.env.VERCEL ? "vercel" : "cloudflare");
const isVercel = target === "vercel";

export default defineConfig({
  cloudflare: isVercel ? false : undefined,
  plugins: isVercel ? [nitro({ preset: "vercel" })] : [],
  tanstackStart: isVercel ? {} : { server: { entry: "server" } },
  vite: {
    optimizeDeps: {
      include: ["@supabase/supabase-js"],
    },
    ssr: {
      noExternal: ["@supabase/supabase-js"],
    },
  },
});
