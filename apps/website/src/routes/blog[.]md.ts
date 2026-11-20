import { createFileRoute } from "@tanstack/react-router";

import { postCollection } from "../../qino/posts";
import { serveIndexAgentMarkdown } from "../server/serve-index-agent-markdown";

// The blog index page's agent Markdown.
export const Route = createFileRoute("/blog.md")({
  server: {
    handlers: {
      GET: ({ request }) =>
        serveIndexAgentMarkdown(request, () =>
          postCollection.getAgentMarkdown(),
        ),
    },
  },
});
