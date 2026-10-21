import { createFileRoute } from "@tanstack/react-router";

import { getLlmsFullTxt } from "../server/get-llms-full-txt";

export const Route = createFileRoute("/llms-full.txt")({
  server: {
    handlers: {
      GET: async () =>
        new Response(await getLlmsFullTxt(), {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }),
    },
  },
});
