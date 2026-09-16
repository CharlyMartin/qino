import fg from "fast-glob";
import { createJiti } from "jiti";

import { SUPPORTED_CODE_EXTENSIONS } from "../../data/globals";
import { isCollection } from "../../lib/guards/is-collection";
import { isItem } from "../../lib/guards/is-item";
import { isQinoPrimitive } from "../../lib/guards/is-qino-primitive";
import { isTree } from "../../lib/guards/is-tree";
import type { AnyCollection } from "../../types/collection";
import type { AnyItem } from "../../types/item";
import type { AnyTree } from "../../types/tree";

export async function loadQinoPrimitives(rootDirPath: string) {
  const files = await fg(
    SUPPORTED_CODE_EXTENSIONS.map((ext) => `**/*${ext}`),
    { cwd: rootDirPath, absolute: true },
  );

  const jiti = createJiti(import.meta.url);

  const collections: AnyCollection[] = [];
  const items: AnyItem[] = [];
  const trees: AnyTree[] = [];

  for (const file of files) {
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
