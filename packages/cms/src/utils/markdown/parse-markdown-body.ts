import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";

import { remarkHeadingId } from "./remark-heading-id";

type ParseMarkdownBodyOptions = {
  /** Parses MDX, falling back to Markdown when it fails. Defaults to `true`. */
  mdx?: boolean;
  /** Parses `{#id}` into `headingId` nodes. */
  headingIds?: boolean;
};

const markdownParser = unified().use(remarkParse).use(remarkGfm);
const mdxParser = markdownParser().use(remarkMdx);
// After `remark-mdx`, so `{#id}` is tried before an MDX expression.
const markdownIdParser = markdownParser().use(remarkHeadingId);
const mdxIdParser = mdxParser().use(remarkHeadingId);

export function parseMarkdownBody(
  body: string,
  { mdx = true, headingIds = false }: ParseMarkdownBodyOptions = {},
) {
  const markdown = headingIds ? markdownIdParser : markdownParser;
  if (!mdx) return markdown.parse(body);

  try {
    return (headingIds ? mdxIdParser : mdxParser).parse(body);
  } catch {
    // Valid Markdown (such as HTML comments) is not always valid MDX.
    return markdown.parse(body);
  }
}
