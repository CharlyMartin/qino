import { getMarkdownNodeProse } from "./get-markdown-node-prose";
import { normalizeMarkdownProse } from "./normalize-markdown-prose";
import { parseMarkdownBody } from "./parse-markdown-body";

export function getMarkdownProse(body: string) {
  // `{#id}` parses to a `headingId` node, not text, so it isn't prose.
  const tree = parseMarkdownBody(body);
  return normalizeMarkdownProse(getMarkdownNodeProse(tree));
}
