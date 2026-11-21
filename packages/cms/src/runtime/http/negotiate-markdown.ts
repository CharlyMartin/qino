import { prefersMarkdown } from "../../lib/http/prefers-markdown";
import type { LoadAgentMarkdown } from "../../types/agent-markdown";

/**
 * Answers a request that wants agent Markdown: its path is a Markdown URL,
 * ending in `.md`, or its `Accept` header prefers `text/markdown` to HTML.
 * Resolves to `null`, without calling `load`, when the request wants HTML, so
 * the caller renders the page; it never answers 406. A `load` that resolves to
 * `null` gets a Markdown 404 linking to `/llms.txt` on the request's origin.
 * The return type is annotated because an inferred `Response` can't be named
 * in the published types.
 */
export async function negotiateMarkdown(
  request: Request,
  load: LoadAgentMarkdown,
): Promise<Response | null> {
  const url = new URL(request.url);
  const isMarkdownUrl = url.pathname.endsWith(".md");
  if (!isMarkdownUrl && !prefersMarkdown(request.headers.get("Accept"))) {
    return null;
  }

  const agentMarkdown = await load();
  const llmsTxt = new URL("/llms.txt", url.origin);
  const body =
    agentMarkdown ??
    `# Not found\n\nThis page doesn't exist. See [llms.txt](${llmsTxt}) for the pages that do.\n`;

  return new Response(request.method == "HEAD" ? null : body, {
    status: agentMarkdown == null ? 404 : 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
    },
  });
}
