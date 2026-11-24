import { servePageMarkdown } from "@/lib/serve-page-markdown";

// Markdown requests for paths nothing answers, from the `fallback` rewrites.
// No page Markdown loads, so they get the Markdown 404.
export function GET(request: Request) {
  return servePageMarkdown(request, () => null);
}
