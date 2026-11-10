import type { Nodes } from "mdast";

type GetHeadingTextOptions = {
  footnoteOrder: string[];
  /** Keeps the text inside MDX components, as `rehype-slug` does. */
  includeJsx: boolean;
};

/**
 * The text a node renders as: footnote references become their number, and
 * only text and code are kept, so raw HTML, MDX expressions, and image alts
 * drop out.
 */
export function getHeadingText(
  node: Nodes,
  options: GetHeadingTextOptions,
): string {
  switch (node.type) {
    case "text":
    case "inlineCode":
      return node.value;
    case "break":
      return "\n";
    case "footnoteReference":
      return String(
        options.footnoteOrder.indexOf(node.identifier.toUpperCase()) + 1,
      );
    case "mdxJsxTextElement":
      if (!options.includeJsx) return "";
  }

  if (!("children" in node)) return "";

  return node.children.map((child) => getHeadingText(child, options)).join("");
}
