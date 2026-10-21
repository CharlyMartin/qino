import type { TreeNode } from "@qino/cms";

import { docsTree } from "../../qino/docs";

export function getDocsLinks(node: TreeNode) {
  return Promise.all(
    node.children.map(async (child) => {
      const { title, description } = await docsTree.getEntry(child.slug);
      return { slug: child.slug, title, description };
    }),
  );
}
