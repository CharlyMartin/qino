import { type LoadPageMarkdown, negotiateMarkdown } from "@qino/cms";

// An index page's Markdown URL, such as `/docs.md`. Its trailing-slash form
// redirects to it, as the router redirects other pages'.
export async function serveIndexPageMarkdown(
  request: Request,
  load: LoadPageMarkdown,
) {
  const url = new URL(request.url);
  if (url.pathname.endsWith("/")) {
    url.pathname = url.pathname.replace(/\/+$/, "");
    return Response.redirect(url, 307);
  }

  // Never `null`: a path ending in `.md` always wants Markdown.
  return (
    (await negotiateMarkdown(request, load)) ??
    new Response(null, { status: 500 })
  );
}
