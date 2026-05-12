import { join } from "node:path";

import fg from "fast-glob";
import { createJiti } from "jiti";

import { COLLECTIONS_FOLDER_NAME, ROOT_FOLDER_NAME } from "../../lib";
import { collectionRegistry } from "../../runtime/collections/registry";
import { assertDirectory } from "../../utils";

export async function loadCollections(qinoDir: string) {
  collectionRegistry.clearRegistry();

  const collectionsDir = join(qinoDir, COLLECTIONS_FOLDER_NAME);
  await assertDirectory(
    collectionsDir,
    `"${ROOT_FOLDER_NAME}/${COLLECTIONS_FOLDER_NAME}" folder not found at "${collectionsDir}". Create at least one collection file.`,
  );

  const files = await fg(["**/*.ts", "**/*.tsx", "**/*.js", "**/*.mjs"], {
    cwd: collectionsDir,
    absolute: true,
  });

  const jiti = createJiti(import.meta.url);
  for (const file of files) {
    await jiti.import(file);
  }
}
