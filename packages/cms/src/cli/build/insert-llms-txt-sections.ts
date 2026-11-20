import { parseMarkdownBody } from "../../utils/markdown/parse-markdown-body";

/**
 * The `llms.txt` template with `sections` inserted before its `## Optional`
 * heading, which llmstxt.org keeps last, or appended when it has none. The
 * result has LF line endings and ends with one newline.
 */
export function insertLlmsTxtSections(template: string, sections: string) {
  const text = template.replace(/\r\n?/g, "\n");
  // Parsed, so a `## Optional` inside a code block isn't taken for one.
  const optional = parseMarkdownBody(text, { mdx: false }).children.find(
    (node) =>
      node.type == "heading" &&
      node.depth == 2 &&
      node.children
        .map((child) => ("value" in child ? child.value : ""))
        .join("")
        .trim() == "Optional",
  );
  const offset = optional?.position?.start.offset ?? text.length;
  const blocks = [
    text.slice(0, offset).trimEnd(),
    sections,
    text.slice(offset).trimEnd(),
  ];
  return `${blocks.filter(Boolean).join("\n\n")}\n`;
}
