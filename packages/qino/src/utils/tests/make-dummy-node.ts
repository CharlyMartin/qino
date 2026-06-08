import type { SupportedFileExtension, TreeNode } from "../../types";

type MakeDummyNodeOptions = Partial<TreeNode> & {
  slug: string;
  extension: SupportedFileExtension;
};

export function makeDummyNode({ extension, ...partial }: MakeDummyNodeOptions) {
  return {
    title: partial.title ?? partial.slug,
    fileName: partial.fileName ?? `${partial.slug}${extension}`,
    filePath: partial.filePath ?? `/abs/${partial.slug}${extension}`,
    children: partial.children ?? [],
    ...partial,
  } as TreeNode;
}
