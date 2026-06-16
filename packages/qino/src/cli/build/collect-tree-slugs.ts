import type { AnyTree } from "../../types";

export async function collectTreeSlugs(tree: AnyTree) {
  const nodes = await tree.getFlatTree();
  const slugs = nodes.map((node) => node.slug);
  return [...slugs].sort();
}
