import type { NodeTree } from "../../types";

export function findNode(
  nodes: Array<NodeTree>,
  slug: string,
  treeDirectory: string,
) {
  const segments = slug.split("/");
  let currentNodes = nodes;
  let found: NodeTree | undefined;

  for (let i = 0; i < segments.length; i += 1) {
    const expectedSlug = segments.slice(0, i + 1).join("/");
    found = currentNodes.find((node) => node.slug == expectedSlug);
    if (!found) {
      throw new Error(
        `Tree entry "${slug}" not found in tree "${treeDirectory}".`,
      );
    }
    currentNodes = found.children;
  }

  if (!found) {
    throw new Error(
      `Tree entry "${slug}" not found in tree "${treeDirectory}".`,
    );
  }

  return found;
}
