import type { Nodes } from "mdast";

/**
 * The text `rehype-slug` slugs once `remark-rehype` renders a node: footnote
 * references become their number, and only text and code are kept, so raw
 * HTML, MDX expressions, and image alts drop out.
 */
export function getHeadingText(node: Nodes, footnoteOrder: string[]): string {
  switch (node.type) {
    case "text":
    case "inlineCode":
      return node.value;
    case "break":
      return "\n";
    case "footnoteReference":
      return String(footnoteOrder.indexOf(node.identifier.toUpperCase()) + 1);
  }

  if (!("children" in node)) return "";

  return node.children
    .map((child) => getHeadingText(child, footnoteOrder))
    .join("");
}
