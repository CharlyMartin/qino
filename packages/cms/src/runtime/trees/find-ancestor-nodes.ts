import type { TreeNode } from "../../types/tree";
import type { ContentPath, Slug } from "../../types/utils";
import { findNode } from "./find-node";

type FindAncestorNodesParams = {
  tree: Array<TreeNode>;
  slug: Slug;
  directory: ContentPath;
};

export function findAncestorNodes({
  tree,
  slug,
  directory,
}: FindAncestorNodesParams) {
  // Throws with the requested slug, so every prefix below is known to exist.
  findNode(tree, slug, directory);

  const segments = slug.split("/");
  return segments
    .slice(0, -1)
    .map((_, index) =>
      findNode(tree, segments.slice(0, index + 1).join("/"), directory),
    );
}
