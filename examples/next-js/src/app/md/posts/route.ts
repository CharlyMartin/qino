import { servePageMarkdown } from "@/lib/serve-page-markdown";
import { postCollection } from "../../../../qino/collections/posts";

// `/posts.md`, and `/posts` when `Accept` lists Markdown first.
export function GET(request: Request) {
  return servePageMarkdown(request, () => postCollection.getPageMarkdown());
}
