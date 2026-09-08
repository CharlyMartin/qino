import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";

import { getMarkdownNodeProse } from "./get-markdown-node-prose";
import { normalizeMarkdownProse } from "./normalize-markdown-prose";

export function getMarkdownProse(body: string) {
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMdx)
    .parse(body);

  return normalizeMarkdownProse(getMarkdownNodeProse(tree));
}
