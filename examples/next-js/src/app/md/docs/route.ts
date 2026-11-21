import { serveAgentMarkdown } from "@/lib/serve-agent-markdown";
import { docsTree } from "../../../../qino/trees/docs";

// `/docs.md`, and `/docs` when `Accept` lists Markdown first.
export function GET(request: Request) {
  return serveAgentMarkdown(request, () => docsTree.getAgentMarkdown());
}
