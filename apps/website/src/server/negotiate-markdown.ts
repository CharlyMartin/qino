import { buildNotFoundMarkdown } from "../lib/build-not-found-markdown";
import { prefersMarkdown } from "../lib/prefers-markdown";
import { getPageMarkdown } from "./get-page-markdown";
import { hasPageRoute } from "./has-page-route";

type NegotiateMarkdownOptions = {
  request: Request;
  next: () => Promise<Response>;
};

// Pages answer `Accept: text/markdown` with Markdown, and so do their 404s.
// Files (`/docs/<slug>.md`, `/llms.txt`, assets) keep their own content type.
export async function negotiateMarkdown({
  request,
  next,
}: NegotiateMarkdownOptions) {
  // Like the router, decode the path and ignore a trailing slash (`/docs/guide/`).
  // The raw path stays percent-encoded, so it can't break out of the 404's code span.
  const rawPath = new URL(request.url).pathname;
  let pathname: string;
  try {
    pathname = decodeURI(rawPath).replace(/(?<=.)\/+$/, "");
  } catch {
    return next();
  }
  const isPage = !pathname.split("/").at(-1)?.includes(".");
  if (!isPage || (request.method != "GET" && request.method != "HEAD")) {
    return next();
  }

  const wantsMarkdown = prefersMarkdown(request.headers.get("Accept"));
  const toMarkdownResponse = (markdown: string, status: number) =>
    new Response(request.method == "HEAD" ? null : markdown, {
      status,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        Vary: "Accept",
      },
    });

  if (wantsMarkdown) {
    const markdown = await getPageMarkdown(pathname);
    if (markdown != null) return toMarkdownResponse(markdown, 200);

    // Start answers requests that don't accept HTML with a 406 before matching
    // routes, so missing pages are caught here. Every docs page has Markdown.
    if (pathname.startsWith("/docs/") || !hasPageRoute(pathname)) {
      return toMarkdownResponse(buildNotFoundMarkdown(rawPath), 404);
    }
  }

  const response = await next();
  if (wantsMarkdown && response.status == 404) {
    return toMarkdownResponse(buildNotFoundMarkdown(rawPath), 404);
  }

  // The same URL can answer in either format, so caches must key on Accept.
  const negotiated = new Response(response.body, response);
  negotiated.headers.append("Vary", "Accept");
  return negotiated;
}
