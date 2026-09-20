import { cp } from "node:fs/promises";
import { join } from "node:path";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  server: { port: 3000 },
  resolve: { tsconfigPaths: true },
  ssr: { noExternal: ["@qino/cms"] },
  plugins: [
    tailwindcss(),
    tanstackStart({
      // /docs redirects and is excluded, so seed the first content page.
      pages: [{ path: "/docs/guide" }],
      prerender: {
        enabled: true,
        crawlLinks: true,
        failOnError: true,
        filter: ({ path }) => path != "/docs" && path != "/docs/",
      },
    }),
    mode != "test" &&
      nitro({
        compatibilityDate: "2026-09-20",
        modules: [
          (nitro) => {
            // Qino needs the content files in the deployed server's working directory.
            nitro.hooks.hook("compiled", () =>
              cp(
                join(nitro.options.rootDir, "content"),
                join(nitro.options.output.serverDir, "content"),
                { recursive: true },
              ),
            );
          },
        ],
      }),
    viteReact(),
  ],
}));
