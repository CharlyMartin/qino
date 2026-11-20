import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";

import { remarkHeadingId } from "./remark-heading-id";

type ParseMarkdownBodyOptions = {
  /** Parses MDX, falling back to Markdown when it fails. Defaults to `true`. */
  mdx?: boolean;
};

const gfmParser = unified().use(remarkParse).use(remarkGfm);
// Both read `{#id}` into `headingId` nodes, as MDX fails on `{#id}` otherwise.
// After `remark-mdx`, so `{#id}` is tried before an MDX expression.
const markdownParser = gfmParser().use(remarkHeadingId);
const mdxParser = gfmParser().use(remarkMdx).use(remarkHeadingId);

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
