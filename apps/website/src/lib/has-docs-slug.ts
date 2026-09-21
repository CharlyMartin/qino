import type { DocsNode } from "../types/docs-node";

export function hasDocsSlug(nodes: Array<DocsNode>, slug: string): boolean {
  return nodes.some(
    (node) => node.slug == slug || hasDocsSlug(node.children, slug),
  );
}
