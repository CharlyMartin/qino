import { join } from "node:path";

import fg from "fast-glob";
import { createJiti } from "jiti";

import { SINGLETONS_FOLDER_NAME } from "../../lib";
import { singletonRegistry } from "../../runtime/singletons/registry";
import { isDirectory } from "../../utils";

export async function loadSingletons(qinoDir: string) {
  singletonRegistry.clearRegistry();

  const singletonsDir = join(qinoDir, SINGLETONS_FOLDER_NAME);

  const singletonsDirExists = await isDirectory(singletonsDir);
  if (!singletonsDirExists) return;

  const files = await fg(["**/*.ts", "**/*.tsx", "**/*.js", "**/*.mjs"], {
    cwd: singletonsDir,
    absolute: true,
  });

  const jiti = createJiti(import.meta.url);
  for (const file of files) {
    await jiti.import(file);
  }
}
