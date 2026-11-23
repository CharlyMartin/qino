import { servePageMarkdown } from "@/lib/serve-page-markdown";
import { docsTree } from "../../../../../qino/trees/docs";

// `/docs/<slug>.md`, and `/docs/<slug>` when `Accept` lists Markdown first.
export async function GET(
  request: Request,
  ctx: RouteContext<"/md/docs/[...slug]">,
) {
  const { slug } = await ctx.params;
  return servePageMarkdown(request, () =>
    docsTree.getPageMarkdown(slug.join("/")),
  );
}
