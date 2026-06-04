import { join } from "node:path";

import fg from "fast-glob";
import { createJiti } from "jiti";

import {
  QinoMeta,
  SINGLETONS_FOLDER_NAME,
  SUPPORTED_CODE_EXTENSIONS,
} from "../../data";
import type { AnySingleton, GenericPath } from "../../types";
import { assertDirectory } from "../../utils";
import { assertQinoPrimitive } from "../../utils/assert-qino-primitive";
import { isSingleton } from "../../utils/is-singleton";

export async function loadSingletons(qinoDir: string) {
  const singletonsDir = join(qinoDir, SINGLETONS_FOLDER_NAME);
  await assertDirectory(
    singletonsDir,
    `"${SINGLETONS_FOLDER_NAME}" folder not found at "${singletonsDir}". Create a "${SINGLETONS_FOLDER_NAME}" folder to hold your singleton files, or remove the folder if you don't have any singletons.`,
  );

  const files = await fg(
    SUPPORTED_CODE_EXTENSIONS.map((ext) => `*${ext}`),
    { cwd: singletonsDir, absolute: true },
  );

  const jiti = createJiti(import.meta.url);
  const registry = new Map<GenericPath, AnySingleton>();

  for (const file of files) {
    const importedValue = (await jiti.import(file)) as Record<string, unknown>;

    for (const value of Object.values(importedValue)) {
      assertQinoPrimitive(
        value,
        `Invalid export in singleton file "${file}". All exports must be valid Qino primitives created with the "createSingleton" function.`,
      );

      if (isSingleton(value)) {
        registry.set(value[QinoMeta].file, value);
      }
    }
  }

  return registry;
}
