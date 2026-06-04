import type { NodeTree } from "../../types";

// Should also allow .mdx and .markdown extensions.
export function makeDummyNode(partial: Partial<NodeTree> & { slug: string }) {
  return {
    title: partial.title ?? partial.slug,
    fileName: partial.fileName ?? `${partial.slug}.md`,
    filePath: partial.filePath ?? `/abs/${partial.slug}.md`,
    children: partial.children ?? [],
    ...partial,
  } as NodeTree;
}
