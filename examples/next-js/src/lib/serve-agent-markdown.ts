import { type LoadAgentMarkdown, negotiateMarkdown } from "@qino/cms";

// Answers a request that `next.config.ts` rewrote to a Markdown route. The
// request keeps its own URL, which it reads as the page's Markdown URL, so it
// always gets Markdown: the rewrite matched an `Accept` with a regex, which
// can't weigh q-values as `negotiateMarkdown` does.
export async function serveAgentMarkdown(
  request: Request,
  load: LoadAgentMarkdown,
) {
  const url = new URL(request.url);
  if (!url.pathname.endsWith(".md")) url.pathname += ".md";

  // Never `null`: a path ending in `.md` always wants Markdown.
  return (
    (await negotiateMarkdown(new Request(url, request), load)) ??
    new Response(null, { status: 500 })
  );
}
