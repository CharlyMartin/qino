import { writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { LockFileSchema, type LockFile } from "../../schemas/lock-file";
import { assertDir, assertFile } from "../../utils";
import { loadConfig } from "./load-config";
import { loadCollections } from "./load-collections";
import { loadSingletons } from "./load-singletons";
import { buildCollectionsLock } from "./build-collections-lock";
import { buildSingletonsLock } from "./build-singletons-lock";

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

  await loadCollections(qinoDir);
  await loadSingletons(qinoDir);

  const collectionsLock = await buildCollectionsLock(contentFolderAbs);
  const singletonsLock = await buildSingletonsLock(contentFolderAbs);

  const lock: LockFile = LockFileSchema.parse({
    qinoVersion: __QINO_VERSION__,
    config: {
      contentFolder: config.contentFolder,
      mediaFolder: config.mediaFolder,
    },
    collections: collectionsLock,
    singletons: singletonsLock,
  });

  const lockPath = join(qinoDir, "qino-lock.json");
  await writeFile(lockPath, JSON.stringify(lock, null, 2) + "\n", "utf8");
  console.log(`Wrote ${lockPath}`);
}
