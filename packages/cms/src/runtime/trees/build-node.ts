import nodePath from "node:path";

import type { TreeNode } from "../../types/tree";
import type { Slug, SupportedFileExtension } from "../../types/utils";

/** Reads a tree file and returns its validated schema output. */
export type ReadParsedFile = (
  filePath: string,
) => Promise<Record<string, unknown>>;

type BuildTreeNodeParams = {
  readParsed: ReadParsedFile;
  extension: SupportedFileExtension;
  titleField: string;
  filePath: string;
  slug: Slug;
  children: Array<TreeNode>;
};

export async function buildNode({
  readParsed,
  titleField,
  filePath,
  slug,
  children,
}: BuildTreeNodeParams) {
  const validated = await readParsed(filePath);

  const title = validated[titleField];
  if (typeof title != "string") {
    throw new Error(
      `${filePath}: expected titleField "${titleField}" to resolve to a string, got ${typeof title}.`,
    );
  }

  return {
    slug,
    title,
    fileName: nodePath.basename(filePath),
    filePath,
    children,
  } as const satisfies TreeNode;
}
