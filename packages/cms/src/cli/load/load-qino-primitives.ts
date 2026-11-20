import nodePath from "node:path";

import type { Jiti } from "jiti";
import { glob } from "tinyglobby";

import { SUPPORTED_CODE_EXTENSIONS, TEST_FILE_NAME } from "../../data/globals";
import { isCollection } from "../../lib/guards/is-collection";
import { isItem } from "../../lib/guards/is-item";
import { isQinoPrimitive } from "../../lib/guards/is-qino-primitive";
import { isTree } from "../../lib/guards/is-tree";
import type { AnyCollection } from "../../types/collection";
import type { AnyItem } from "../../types/item";
import type { AnyTree } from "../../types/tree";

export async function loadQinoPrimitives(rootDirPath: string, jiti: Jiti) {
  const files = await glob(
    SUPPORTED_CODE_EXTENSIONS.map((ext) => `**/*${ext}`),
    { cwd: rootDirPath, absolute: true },
  );
  // Test files run only under their runner. Matched by file name, so a folder
  // named like one still loads.
  const definitionFiles = files.filter(
    (file) => !TEST_FILE_NAME.test(nodePath.basename(file)),
  );

  const collections: AnyCollection[] = [];
  const items: AnyItem[] = [];
  const trees: AnyTree[] = [];

  for (const file of definitionFiles) {
    const importedValue = await jiti.import<Record<string, unknown>>(file);

    for (const value of Object.values(importedValue)) {
      if (!isQinoPrimitive(value)) continue;

      if (isCollection(value)) {
        collections.push(value);
      } else if (isItem(value)) {
        items.push(value);
      } else if (isTree(value)) {
        trees.push(value);
      }
    }
  }

  return { collections, items, trees };
}
