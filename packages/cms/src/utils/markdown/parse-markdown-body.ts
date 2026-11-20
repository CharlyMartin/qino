import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";

import { remarkHeadingId } from "./remark-heading-id";

type ParseMarkdownBodyOptions = {
  /** Parses MDX, falling back to Markdown when it fails. Defaults to `true`. */
  mdx?: boolean;
};

// Every parser reads `{#id}` into `headingId` nodes: without it, MDX fails on
// `{#id}`. After `remark-mdx`, so `{#id}` is tried before an MDX expression.
const parser = unified().use(remarkParse).use(remarkGfm);
const markdownParser = parser().use(remarkHeadingId);
const mdxParser = parser().use(remarkMdx).use(remarkHeadingId);

export function parseMarkdownBody(
  body: string,
  { mdx = true }: ParseMarkdownBodyOptions = {},
) {
  if (!mdx) return markdownParser.parse(body);

  try {
    return mdxParser.parse(body);
  } catch {
    // Valid Markdown (such as HTML comments) is not always valid MDX.
    return markdownParser.parse(body);
  }
}
