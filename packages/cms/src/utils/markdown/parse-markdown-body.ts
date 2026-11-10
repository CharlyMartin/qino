import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";

const markdownParser = unified().use(remarkParse).use(remarkGfm);
const mdxParser = markdownParser().use(remarkMdx);

/** Parses MDX unless `mdx` is off, falling back to Markdown when it fails. */
export function parseMarkdownBody(body: string, mdx = true) {
  if (!mdx) return markdownParser.parse(body);

  try {
    return mdxParser.parse(body);
  } catch {
    // Valid Markdown (such as HTML comments) is not always valid MDX.
    return markdownParser.parse(body);
  }
}
