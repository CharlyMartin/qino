import type { Heading, Nodes } from "mdast";

/**
 * Headings in document order, including those nested in other blocks. Footnote
 * definitions are skipped: they render elsewhere, if at all.
 */
export function getMarkdownHeadings(node: Nodes): Heading[] {
  if (node.type == "heading") return [node];
  if (node.type == "footnoteDefinition" || !("children" in node)) return [];

  return node.children.flatMap(getMarkdownHeadings);
}
