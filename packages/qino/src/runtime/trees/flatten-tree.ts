import type { TreeNode } from "../../types/tree";

export function flattenTree(nodes: Array<TreeNode>) {
  const result: Array<TreeNode> = [];

  for (const node of nodes) {
    result.push(node);
    if (node.children.length > 0) {
      result.push(...flattenTree(node.children));
    }
  }

  return result;
}
