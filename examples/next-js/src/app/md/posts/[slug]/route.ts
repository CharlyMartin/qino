import { serveAgentMarkdown } from "@/lib/serve-agent-markdown";
import { postCollection } from "../../../../../qino/collections/posts";

// `/posts/<slug>.md`, and `/posts/<slug>` when `Accept` lists Markdown first.
export async function GET(
  request: Request,
  ctx: RouteContext<"/md/posts/[slug]">,
) {
  const { slug } = await ctx.params;
  return serveAgentMarkdown(request, () =>
    postCollection.getAgentMarkdown(slug),
  );
}
