import { stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createJiti } from "jiti";
import { z } from "zod";
import { ConfigSchema, type Config } from "../../runtime/create-config";
import { LockFileSchema } from "../../lib/lock-file";

declare const __QINO_VERSION__: string;

export async function runBuild() {
  const cwd = process.cwd();

  const qinoDir = join(cwd, "qino");
  await assertDir(qinoDir, `qino folder not found at ${qinoDir}`);

  const configPath = join(qinoDir, "config.ts");
  await assertFile(configPath, `qino/config.ts not found at ${configPath}`);

  const config = await loadConfig(configPath);

  const contentFolderAbs = resolve(cwd, config.contentFolder);
  await assertDir(
    contentFolderAbs,
    `contentFolder "${config.contentFolder}" is not a directory (resolved to ${contentFolderAbs})`,
  );

  const mediaFolderAbs = resolve(cwd, config.mediaFolder);
  await assertDir(
    mediaFolderAbs,
    `mediaFolder "${config.mediaFolder}" is not a directory (resolved to ${mediaFolderAbs})`,
  );

  const lock = LockFileSchema.parse({
    qinoVersion: __QINO_VERSION__,
    config: {
      contentFolder: config.contentFolder,
      mediaFolder: config.mediaFolder,
    },
  });

  const lockPath = join(qinoDir, "qino-lock.json");
  await writeFile(lockPath, JSON.stringify(lock, null, 2) + "\n", "utf8");
  console.log(`Wrote ${lockPath}`);
}

async function assertDir(path: string, message: string) {
  let isDir = false;
  try {
    isDir = (await stat(path)).isDirectory();
  } catch {}
  if (!isDir) throw new Error(message);
}

async function assertFile(path: string, message: string) {
  let isFile = false;
  try {
    isFile = (await stat(path)).isFile();
  } catch {}
  if (!isFile) throw new Error(message);
}

async function loadConfig(configPath: string): Promise<Config> {
  const jiti = createJiti(import.meta.url);
  const mod = (await jiti.import(configPath)) as { default?: unknown };
  if (!mod || typeof mod != "object" || !mod.default) {
    throw new Error("qino/config.ts must default-export createConfig({...})");
  }
  const result = ConfigSchema.safeParse(mod.default);
  if (!result.success) {
    throw new Error(`Invalid config in ${configPath}.\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
