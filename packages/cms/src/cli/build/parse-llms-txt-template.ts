import { parseFrontmatter } from "@qino/tooling/frontmatter";

import { parseMarkdownBody } from "../../utils/markdown/parse-markdown-body";

/**
 * The `llms.txt` template's `text`, without frontmatter or leading blank
 * lines and with LF line endings, and its top-level `blocks`, parsed as
 * Markdown with heading ids, so a `#` line inside a code block isn't taken
 * for a heading.
 */
export function parseLlmsTxtTemplate(template: string) {
  const text = parseFrontmatter(template)
    .body.replace(/\r\n?/g, "\n")
    .replace(/^(?:[ \t]*\n)+/, "");
  const blocks = parseMarkdownBody(text, { mdx: false }).children;
  return { text, blocks };
}
