import { serveAgentMarkdown } from "@/lib/serve-agent-markdown";
import { postCollection } from "../../../../qino/collections/posts";

// `/posts.md`, and `/posts` when `Accept` lists Markdown first.
export function GET(request: Request) {
  return serveAgentMarkdown(request, () => postCollection.getAgentMarkdown());
}
