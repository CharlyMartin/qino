import type { TreeNode } from "@qino/cms";

import type { DocsNode } from "../types/docs-node";

export function toDocsNode(node: TreeNode): DocsNode {
  return {
    slug: node.slug,
    title: node.title,
    children: node.children.map(toDocsNode),
  };
}
