import type { TreeNode } from "../../types/tree";
import type { GenericPath, Slug } from "../../types/utils";
import { flattenTree } from "./flatten-tree";

type GetNeighborNodeParams = {
  tree: Array<TreeNode>;
  slug: Slug;
  directory: GenericPath;
  offset: 1 | -1;
};

export function getNeighborNode({
  tree,
  slug,
  directory,
  offset,
}: GetNeighborNodeParams) {
  const flatTree = flattenTree(tree);
  const index = flatTree.findIndex((node) => node.slug == slug);

  if (index == -1) {
    throw new Error(`Tree entry "${slug}" not found in tree "${directory}".`);
  }

  const neighborIndex = index + offset;
  const neighbourNode = flatTree[neighborIndex];

  if (!neighbourNode) {
    return null;
  }

  return neighbourNode;
}
