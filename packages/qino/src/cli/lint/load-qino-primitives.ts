import fg from "fast-glob";
import { createJiti } from "jiti";

import { SUPPORTED_CODE_EXTENSIONS } from "../../data";
import type { AnyCollection, AnySingleton, AnyTree } from "../../types";
import { isCollection } from "../../utils/is-collection";
import { isQinoPrimitive } from "../../utils/is-qino-primitive";
import { isSingleton } from "../../utils/is-singleton";
import { isTree } from "../../utils/is-tree";

export async function loadQinoPrimitives(rootDirPath: string) {
  const files = await fg(
    SUPPORTED_CODE_EXTENSIONS.map((ext) => `**/*${ext}`),
    { cwd: rootDirPath, absolute: true },
  );

  const jiti = createJiti(import.meta.url);

  const collections: AnyCollection[] = [];
  const singletons: AnySingleton[] = [];
  const trees: AnyTree[] = [];

  for (const file of files) {
    const importedValue = await jiti.import<Record<string, unknown>>(file);

    for (const value of Object.values(importedValue)) {
      if (!isQinoPrimitive(value)) continue;

      if (isCollection(value)) {
        collections.push(value);
      } else if (isSingleton(value)) {
        singletons.push(value);
      } else if (isTree(value)) {
        trees.push(value);
      }
    }
  }

  return { collections, singletons, trees };
}
