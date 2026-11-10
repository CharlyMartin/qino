import { getMarkdownNodeProse } from "./get-markdown-node-prose";
import { normalizeMarkdownProse } from "./normalize-markdown-prose";
import { parseMarkdownBody } from "./parse-markdown-body";

export function getMarkdownProse(body: string) {
  return normalizeMarkdownProse(getMarkdownNodeProse(parseMarkdownBody(body)));
}
