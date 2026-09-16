import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";

import { getMarkdownNodeProse } from "./get-markdown-node-prose";
import { normalizeMarkdownProse } from "./normalize-markdown-prose";

const markdownParser = unified().use(remarkParse).use(remarkGfm);
const mdxParser = markdownParser().use(remarkMdx);

export function getMarkdownProse(body: string) {
  let tree: ReturnType<typeof markdownParser.parse>;

  try {
    tree = mdxParser.parse(body);
  } catch {
    // Valid Markdown (such as HTML comments) is not always valid MDX.
    tree = markdownParser.parse(body);
  }

  return normalizeMarkdownProse(getMarkdownNodeProse(tree));
}
