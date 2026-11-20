import { getHeadingText } from "../../utils/markdown/get-heading-text";
import { parseMarkdownBody } from "../../utils/markdown/parse-markdown-body";
import { cleanLlmsTxtTemplate } from "./clean-llms-txt-template";

type InsertLlmsTxtSectionsParams = {
  /** The `llms.txt` template, as read. */
  template: string;
  /** The generated sections, as Markdown. */
  sections: string;
};

/**
 * The `llms.txt` template without frontmatter, with `sections` inserted
 * before its `## Optional` heading, which llmstxt.org keeps last, or appended
 * when it has none. The result has LF line endings, opens with the template's
 * first line and ends with one newline.
 */
export function insertLlmsTxtSections({
  template,
  sections,
}: InsertLlmsTxtSectionsParams) {
  const text = cleanLlmsTxtTemplate(template);
  // Parsed, so a `## Optional` inside a code block isn't taken for one.
  const optional = parseMarkdownBody(text, {
    mdx: false,
    headingIds: true,
  }).children.find(
    (node) =>
      node.type == "heading" &&
      node.depth == 2 &&
      getHeadingText(node, { footnoteOrder: [], includeJsx: false }).trim() ==
        "Optional",
  );
  const offset = optional?.position?.start.offset ?? text.length;
  const blocks = [
    text.slice(0, offset).trimEnd(),
    sections,
    text.slice(offset).trimEnd(),
  ];
  return `${blocks.filter(Boolean).join("\n\n")}\n`;
}
