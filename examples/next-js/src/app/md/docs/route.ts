import { servePageMarkdown } from "@/lib/serve-page-markdown";
import { docsTree } from "../../../../qino/trees/docs";

// `/docs.md`, and `/docs` when `Accept` lists Markdown first.
export function GET(request: Request) {
  return servePageMarkdown(request, () => docsTree.getPageMarkdown());
}
