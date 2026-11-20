import { negotiateMarkdown } from "@qino/cms";
import { createFileRoute } from "@tanstack/react-router";

import { postCollection } from "../../qino/posts";

// The blog index page's agent Markdown. The path ends in `.md`, so
// negotiateMarkdown always answers.
export const Route = createFileRoute("/blog.md")({
  server: {
    handlers: {
      GET: async ({ request, next }) =>
        (await negotiateMarkdown(request, () =>
          postCollection.getAgentMarkdown(),
        )) ?? next(),
    },
  },
});
