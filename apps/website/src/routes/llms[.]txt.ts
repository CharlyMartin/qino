import { createFileRoute } from "@tanstack/react-router";

import { getLlmsTxt } from "../server/get-llms-txt";

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async () =>
        new Response(await getLlmsTxt(), {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }),
    },
  },
});
