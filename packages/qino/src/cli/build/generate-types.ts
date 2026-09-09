import nodePath from "node:path";

import {
  GENERATED_DIR_NAME,
  GENERATED_TYPES_FILE_NAME,
  QinoPrimitiveMarker,
  ROOT_FOLDER_NAME,
} from "../../data";
import type { AnyCollection, AnyTree } from "../../types";
import { collectTreeSlugs } from "./collect-tree-slugs";
import { generateTypeNames } from "./generate-type-names";
import { renderGeneratedTypes } from "./render-generated-types";
import { writeGeneratedTypes } from "./write-generated-types";

type GenerateTypesParams = {
  collections?: Array<AnyCollection>;
  trees?: Array<AnyTree>;
};

/**
 * Generates `qino/_generated/types.d.ts` with a slug union per collection and tree,
 * augmenting `QinoSlugRegistry` so getters autocomplete known slugs.
 * Singletons are skipped — `getData()` takes no slug.
 */
export async function generateTypes({
  collections = [],
  trees = [],
}: GenerateTypesParams) {
  const collected = [
    ...(await Promise.all(
      collections.map(async (collection) => ({
        directory: collection[QinoPrimitiveMarker].directory,
        slugs: await collection.getAllSlugs(),
      })),
    )),
    ...(await Promise.all(
      trees.map(async (tree) => ({
        directory: tree[QinoPrimitiveMarker].directory,
        slugs: await collectTreeSlugs(tree),
      })),
    )),
  ];

  collected.sort((a, b) => a.directory.localeCompare(b.directory));

  const generatedSlugTypeNames = generateTypeNames(collected);

  const content = renderGeneratedTypes(generatedSlugTypeNames);

  const filePath = nodePath.join(
    process.cwd(),
    ROOT_FOLDER_NAME,
    GENERATED_DIR_NAME,
    GENERATED_TYPES_FILE_NAME,
  );

  return writeGeneratedTypes(filePath, content);
}
