import type { Nodes } from "mdast";

/** Footnote identifiers referenced outside definitions, in document order. */
export function getFootnoteReferences(node: Nodes): string[] {
  if (node.type == "footnoteReference") return [node.identifier.toUpperCase()];
  if (node.type == "footnoteDefinition" || !("children" in node)) return [];

  return node.children.flatMap(getFootnoteReferences);
}
