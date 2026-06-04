import fs from "node:fs/promises";
import nodePath from "node:path";

import { parseFile } from "../../lib/parse/parse-file";
import { validate } from "../../lib/validate";
import type {
  NodeTree,
  ObjectSchema,
  SupportedFileExtension,
} from "../../types";

type BuildTreeNodeParams = {
  schema: ObjectSchema;
  extension: SupportedFileExtension;
  titleField: string;
  filePath: string;
  slug: string;
  children: Array<NodeTree>;
};

export async function buildTreeNode({
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
  } as const satisfies NodeTree;
}
