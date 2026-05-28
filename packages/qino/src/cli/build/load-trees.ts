import { join } from "node:path";

import fg from "fast-glob";
import { createJiti } from "jiti";

import {
  QinoMeta,
  SUPPORTED_CODE_EXTENSIONS,
  TREES_FOLDER_NAME,
} from "../../data";
import type { AnyTree } from "../../types";
import { isDirectory } from "../../utils";
import { assertQinoPrimitive } from "../../utils/assert-qino-primitive";
import { isTree } from "../../utils/is-tree";

export async function loadTrees(qinoDir: string) {
  const treesDir = join(qinoDir, TREES_FOLDER_NAME);

  const registry = new Map<string, AnyTree>();

  if (!(await isDirectory(treesDir))) return registry;

  const files = await fg(
    SUPPORTED_CODE_EXTENSIONS.map((ext) => `*${ext}`),
    { cwd: treesDir, absolute: true },
  );

  const jiti = createJiti(import.meta.url);

  for (const file of files) {
    const importedValue = (await jiti.import(file)) as Record<string, unknown>;

    for (const value of Object.values(importedValue)) {
      assertQinoPrimitive(
        value,
        `Invalid export in tree file "${file}". All exports must be valid Qino primitives created with the "createTree" function.`,
      );

      if (isTree(value)) {
        registry.set(value[QinoMeta].directory, value);
      }
    }
  }

  return registry;
}
