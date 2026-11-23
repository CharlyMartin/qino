import { createFileRoute } from "@tanstack/react-router";

import { docsTree } from "../../qino/docs";
import { serveIndexPageMarkdown } from "../server/serve-index-page-markdown";

// The docs index page's Markdown.
export const Route = createFileRoute("/docs.md")({
  server: {
    handlers: {
      GET: ({ request }) =>
        serveIndexPageMarkdown(request, () => docsTree.getPageMarkdown()),
    },
  },
});
