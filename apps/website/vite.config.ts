import { cp } from "node:fs/promises";
import { join } from "node:path";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

import { site } from "./src/lib/site.ts";
import { vercelMarkdownRoutes } from "./src/lib/vercel-markdown-routes.ts";

export default defineConfig(({ mode }) => ({
  server: { port: 3000 },
  resolve: { tsconfigPaths: true },
  ssr: { noExternal: ["@qino/cms"] },
  plugins: [
    tailwindcss(),
    tanstackStart({
      pages: [
        // Rendered per request so `?repo=` personalises the HTML; listed here for the sitemap.
        { path: "/contentlayer-exit", prerender: { enabled: false } },
      ],
      prerender: {
        enabled: true,
        crawlLinks: true,
        failOnError: true,
        // Skip duplicates of other pages: trailing slashes ("/blog/") and crawled
        // anchors ("/docs/guide/cli#media"), which would also race to write the
        // same file. Pages reach the sitemap before this filter runs, so exclude
        // skipped ones there too.
        filter: (page) => {
          const keep =
            page.path == "/" ||
            (!page.path.endsWith("/") && !page.path.includes("#"));
          if (!keep) page.sitemap = { exclude: true };
          return keep;
        },
        // "View Markdown" links get `/docs/<slug>.md` prerendered; they're not pages.
        onSuccess: ({ page }) =>
          page.path.endsWith(".md")
            ? { sitemap: { exclude: true } }
            : undefined,
      },
      sitemap: { enabled: true, host: site.url },
    }),
    mode != "test" &&
      nitro({
        compatibilityDate: "2026-09-20",
        // Nitro places them ahead of Vercel's filesystem handler.
        vercel: { config: { version: 3, routes: vercelMarkdownRoutes } },
        modules: [
          (nitro) => {
            // qino needs the content files in the deployed server's working directory.
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
