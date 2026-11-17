import { getDocsMarkdown } from "./get-docs-markdown";
import { getLlmsTxt } from "./get-llms-txt";

// The Markdown version of a page, or null when the path has none.
// The homepage's is llms.txt: the site summary with every docs page linked.
export async function getPageMarkdown(pathname: string) {
  if (pathname == "/") return getLlmsTxt();
  if (pathname.startsWith("/docs/")) {
    return getDocsMarkdown(pathname.slice("/docs/".length));
  }
  return null;
}
