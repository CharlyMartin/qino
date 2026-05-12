import { createJiti } from "jiti";
import { collectionRegistry } from "../../runtime/collections/registry";
import { join } from "path";
import { stat } from "fs/promises";
import fg from "fast-glob";

export async function loadCollections(qinoDir: string) {
  collectionRegistry.clearRegistry();

  const collectionsDir = join(qinoDir, "collections");
  let isDir = false;
  try {
    isDir = (await stat(collectionsDir)).isDirectory();
  } catch {}
  if (!isDir) {
    throw new Error(
      `qino/collections folder not found at ${collectionsDir}. Create at least one collection file.`,
    );
  }

  const files = await fg(["**/*.ts", "**/*.tsx", "**/*.js", "**/*.mjs"], {
    cwd: collectionsDir,
    absolute: true,
  });

  const jiti = createJiti(import.meta.url);
  for (const file of files) {
    await jiti.import(file);
  }
}
