import { getHeadingText } from "../../utils/markdown/get-heading-text";
import { parseLlmsTxtTemplate } from "./parse-llms-txt-template";

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
  const { text, blocks } = parseLlmsTxtTemplate(template);
  const optional = blocks.find(
    (node) =>
      node.type == "heading" &&
      node.depth == 2 &&
      getHeadingText(node, { footnoteOrder: [], includeJsx: false }).trim() ==
        "Optional",
  );
  const offset = optional?.position?.start.offset ?? text.length;
  const parts = [
    text.slice(0, offset).trimEnd(),
    sections,
    text.slice(offset).trimEnd(),
  ];
  return `${parts.filter(Boolean).join("\n\n")}\n`;
}
