import {
  GENERATED_TYPES_FILE_NAME,
  QinoPrimitiveMarker,
} from "../../data/globals";
import type { AnyCollection } from "../../types/collection";
import type { AnyTree } from "../../types/tree";
import { collectTreeSlugs } from "./collect-tree-slugs";
import { compareCodeUnits } from "./compare-code-units";
import { generateTypeNames } from "./generate-type-names";
import { getGeneratedFilePath } from "./get-generated-file-path";
import { renderGeneratedTypes } from "./render-generated-types";
import { writeGeneratedFile } from "./write-generated-file";

type GenerateTypesParams = {
  collections?: Array<AnyCollection>;
  trees?: Array<AnyTree>;
};

/**
 * Generates `qino/_generated/types.d.ts` with a slug union per collection and tree,
 * augmenting `QinoSlugRegistry` so getters autocomplete known slugs.
 * Items are skipped — `getEntry()` takes no slug.
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

  collected.sort((a, b) => compareCodeUnits(a.directory, b.directory));

  const generatedSlugTypeNames = generateTypeNames(collected);

  const content = renderGeneratedTypes(generatedSlugTypeNames);

  return writeGeneratedFile(
    getGeneratedFilePath(GENERATED_TYPES_FILE_NAME),
    content,
  );
}
