import { createFileRoute } from "@tanstack/react-router";

import { postCollection } from "../../qino/posts";
import { serveIndexPageMarkdown } from "../server/serve-index-page-markdown";

// The blog index page's Markdown.
export const Route = createFileRoute("/blog.md")({
  server: {
    handlers: {
      GET: ({ request }) =>
        serveIndexPageMarkdown(request, () => postCollection.getPageMarkdown()),
    },
  },
});
