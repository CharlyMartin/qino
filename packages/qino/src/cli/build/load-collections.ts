import { join } from "node:path";

import fg from "fast-glob";
import { createJiti } from "jiti";

import {
  COLLECTIONS_FOLDER_NAME,
  QinoMeta,
  ROOT_FOLDER_NAME,
  SUPPORTED_CODE_EXTENSIONS,
} from "../../data";
import type { AnyCollection } from "../../types";
import { assertDirectory } from "../../utils";
import { assertQinoPrimitive } from "../../utils/assert-qino-primitive";
import { isCollection } from "../../utils/is-collection";

export async function loadCollections(qinoDir: string) {
  const collectionsDir = join(qinoDir, COLLECTIONS_FOLDER_NAME);
  await assertDirectory(
    collectionsDir,
    `"${ROOT_FOLDER_NAME}/${COLLECTIONS_FOLDER_NAME}" folder not found at "${collectionsDir}". Create at least one collection file.`,
  );

  const files = await fg(
    SUPPORTED_CODE_EXTENSIONS.map((ext) => `*${ext}`),
    { cwd: collectionsDir, absolute: true },
  );

  const jiti = createJiti(import.meta.url);
  const registry = new Map<string, AnyCollection>();

  for (const file of files) {
    const importedValue = (await jiti.import(file)) as Record<string, unknown>;

    for (const value of Object.values(importedValue)) {
      assertQinoPrimitive(
        value,
        `Invalid export in collection file "${file}". All exports must be valid Qino primitives created with the "createCollection" function.`,
      );

      if (isCollection(value)) {
        registry.set(value[QinoMeta].directory, value);
      }
    }
  }

  return registry;
}
