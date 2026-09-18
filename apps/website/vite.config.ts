import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
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
    viteReact(),
  ],
});
