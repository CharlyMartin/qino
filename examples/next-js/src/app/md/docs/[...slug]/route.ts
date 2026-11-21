import { serveAgentMarkdown } from "@/lib/serve-agent-markdown";
import { docsTree } from "../../../../../qino/trees/docs";

// `/docs/<slug>.md`, and `/docs/<slug>` when `Accept` lists Markdown first.
export async function GET(
  request: Request,
  ctx: RouteContext<"/md/docs/[...slug]">,
) {
  const { slug } = await ctx.params;
  return serveAgentMarkdown(request, () =>
    docsTree.getAgentMarkdown(slug.join("/")),
  );
}
