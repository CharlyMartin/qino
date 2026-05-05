import { stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createJiti } from "jiti";
import type { Config } from "../../runtime/create-config";

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

  const lock = {
    qinoVersion: __QINO_VERSION__,
    config: {
      contentFolder: config.contentFolder,
      mediaFolder: config.mediaFolder,
    },
  };

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
  const mod = (await jiti.import(configPath)) as { default?: Config };
  if (!mod || typeof mod != "object" || !mod.default) {
    throw new Error("qino/config.ts must default-export createConfig({...})");
  }
  const cfg = mod.default;
  if (typeof cfg.contentFolder != "string" || typeof cfg.mediaFolder != "string") {
    throw new Error("Invalid config: contentFolder and mediaFolder must be strings");
  }
  return cfg;
}
