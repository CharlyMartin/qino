import type { NodeTree } from "../../types";

export function flattenTree(nodes: Array<NodeTree>) {
  const result: Array<NodeTree> = [];

  for (const node of nodes) {
    result.push(node);
    if (node.children.length > 0) {
      result.push(...flattenTree(node.children));
    }
  }

  return result;
}
