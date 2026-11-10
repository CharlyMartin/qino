import type { FootnoteDefinition, Nodes } from "mdast";

/** Every footnote definition, in document order. */
export function getFootnoteDefinitions(node: Nodes): FootnoteDefinition[] {
  if (node.type == "footnoteDefinition") return [node];
  if (!("children" in node)) return [];

  return node.children.flatMap(getFootnoteDefinitions);
}
