import { prefersMarkdown } from "../../lib/http/prefers-markdown";

/** Returns a page's agent Markdown, or `null` when the page doesn't exist. */
type LoadMarkdown = () => string | null | Promise<string | null>;

/**
 * Answers a request that wants Markdown: its path ends in `.md`, or its
 * `Accept` header prefers `text/markdown` to HTML. Resolves to `null`, without
 * calling `load`, when the request wants HTML, so the caller renders the page;
 * it never answers 406. A `load` that resolves to `null` gets a Markdown 404
 * pointing to `/llms.txt` on the request's origin.
 */
// Annotated: an inferred `Response` can't be named in the published types.
export async function negotiateMarkdown(
  request: Request,
  load: LoadMarkdown,
): Promise<Response | null> {
  const url = new URL(request.url);
  const isMarkdownUrl = url.pathname.endsWith(".md");
  if (!isMarkdownUrl && !prefersMarkdown(request.headers.get("Accept"))) {
    return null;
  }

  const markdown = await load();
  const llmsTxt = new URL("/llms.txt", url.origin);
  const body =
    markdown ??
    `# Not found\n\nThis page doesn't exist. See ${llmsTxt} for the pages that do.\n`;

  return new Response(request.method == "HEAD" ? null : body, {
    status: markdown == null ? 404 : 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
    },
  });
}
