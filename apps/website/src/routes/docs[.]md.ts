import { negotiateMarkdown } from "@qino/cms";
import { createFileRoute } from "@tanstack/react-router";

import { docsTree } from "../../qino/docs";

// The docs index page's agent Markdown. The path ends in `.md`, so
// negotiateMarkdown always answers.
export const Route = createFileRoute("/docs.md")({
  server: {
    handlers: {
      GET: async ({ request, next }) =>
        (await negotiateMarkdown(request, () => docsTree.getAgentMarkdown())) ??
        next(),
    },
  },
});
