import fs from "node:fs/promises";
import nodePath from "node:path";

import { parseFile } from "../../lib/parse/parse-file";
import { validate } from "../../lib/validate/validate";
import type { ObjectSchema } from "../../types/schema";
import type { TreeNode } from "../../types/tree";
import type { Slug, SupportedFileExtension } from "../../types/utils";

type BuildTreeNodeParams = {
  schema: ObjectSchema;
  extension: SupportedFileExtension;
  titleField: string;
  filePath: string;
  slug: Slug;
  children: Array<TreeNode>;
};

export async function buildNode({
  schema,
  titleField,
  filePath,
  slug,
  children,
}: BuildTreeNodeParams) {
  const raw = await fs.readFile(filePath, "utf-8");
  const validated = parseFile({
    schema,
    data: raw,
    filePath,
    validatorFn: validate,
  });

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
