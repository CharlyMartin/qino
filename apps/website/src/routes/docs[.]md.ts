import { createFileRoute } from "@tanstack/react-router";

import { docsTree } from "../../qino/docs";
import { serveIndexAgentMarkdown } from "../server/serve-index-agent-markdown";

// The docs index page's agent Markdown.
export const Route = createFileRoute("/docs.md")({
  server: {
    handlers: {
      GET: ({ request }) =>
        serveIndexAgentMarkdown(request, () => docsTree.getAgentMarkdown()),
    },
  },
});
