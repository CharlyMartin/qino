import { join } from "path";
import { singletonRegistry } from "../../runtime/singletons/registry";
import { stat } from "fs/promises";
import fg from "fast-glob";
import { createJiti } from "jiti";

export async function loadSingletons(qinoDir: string) {
  singletonRegistry.clearRegistry();

  const singletonsDir = join(qinoDir, "singletons");
  let isDir = false;
  try {
    isDir = (await stat(singletonsDir)).isDirectory();
  } catch {}
  if (!isDir) return;

  const files = await fg(["**/*.ts", "**/*.tsx", "**/*.js", "**/*.mjs"], {
    cwd: singletonsDir,
    absolute: true,
  });

  const jiti = createJiti(import.meta.url);
  for (const file of files) {
    await jiti.import(file);
  }
}
