import { getMarkdownNodeProse } from "./get-markdown-node-prose";
import { normalizeMarkdownProse } from "./normalize-markdown-prose";
import { parseMarkdownBody } from "./parse-markdown-body";

export function getMarkdownProse(body: string) {
  // With heading ids, `{#id}` is left out and doesn't break the MDX parse.
  const tree = parseMarkdownBody(body, { headingIds: true });
  return normalizeMarkdownProse(getMarkdownNodeProse(tree));
}
