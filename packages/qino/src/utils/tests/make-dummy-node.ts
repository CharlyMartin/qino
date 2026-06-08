import type { SupportedFileExtension, TreeNode } from "../../types";
import type { Slug } from "../../types/utils";

type MakeDummyNodeOptions = Partial<TreeNode> & {
  slug: Slug;
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
