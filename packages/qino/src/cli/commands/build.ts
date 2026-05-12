import { stat, writeFile, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createJiti } from "jiti";
import fg from "fast-glob";
import { z } from "zod";
import { ConfigSchema, type Config } from "../../runtime/config";
import { LockFileSchema, type LockFile } from "../../schemas/lock-file";
import { JSON_PATH_ARRAY, QinoMeta } from "../../lib";
import type {
  AnyCollection,
  AnySingleton,
  SupportedFileExtension,
} from "../../types";
import { validateJsonFile, validateMarkdownFile } from "../../lib/validate";
import { collectionRegistry } from "../../runtime/collections/registry";
import { singletonRegistry } from "../../runtime/singletons/registry";

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
    throw new Error(
      `Invalid config in ${configPath}.\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}

async function loadCollections(qinoDir: string) {
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

async function loadSingletons(qinoDir: string) {
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

type RelationLockEntry = {
  field: string;
  target: string;
  kind: "collection" | "singleton";
  cardinality: "one" | "many";
};

type CollectionLockEntry = {
  directory: string;
  extension: SupportedFileExtension;
  relations: Array<RelationLockEntry>;
};

type SingletonLockEntry = {
  file: string;
  relations: Array<RelationLockEntry>;
};

async function buildCollectionsLock(contentFolderAbs: string) {
  const registry = collectionRegistry.getRegistry();
  if (registry.size == 0) {
    throw new Error(
      "No collections registered. Each qino/collections/*.ts file must call createCollection.",
    );
  }

  const out: Record<string, CollectionLockEntry> = {};

  for (const [collectionPath, collection] of registry.entries()) {
    const meta = collection[QinoMeta];
    const collectionDir = join(contentFolderAbs, meta.directory);

    const relPaths = await fg(`**/*${meta.extension}`, { cwd: collectionDir });
    if (relPaths.length == 0) {
      throw new Error(
        `Collection "${collectionPath}" (directory: ${meta.directory}) has no entries. A collection must have at least one entry.`,
      );
    }

    for (const relPath of relPaths) {
      const filePath = join(collectionDir, relPath);
      const raw = await readFile(filePath, "utf-8");
      const validatorFn =
        meta.extension == ".json" ? validateJsonFile : validateMarkdownFile;

      validatorFn({
        schema: meta.schema,
        raw,
        filePath,
      });
    }

    out[collectionPath] = {
      directory: meta.directory,
      extension: meta.extension,
      relations: deriveRelations(meta.relations),
    };
  }

  return out;
}

async function buildSingletonsLock(contentFolderAbs: string) {
  const registry = singletonRegistry.getRegistry();
  const out: Record<string, SingletonLockEntry> = {};

  for (const [singletonFile, singleton] of registry.entries()) {
    const meta = singleton[QinoMeta];
    const absoluteFilePath = join(contentFolderAbs, meta.file);

    await assertFile(
      absoluteFilePath,
      `Singleton "${singletonFile}" not found at ${absoluteFilePath}.`,
    );

    const raw = await readFile(absoluteFilePath, "utf-8");
    const validatorFn =
      meta.extension == ".json" ? validateJsonFile : validateMarkdownFile;

    validatorFn({
      schema: meta.schema,
      raw,
      filePath: absoluteFilePath,
    });

    out[singletonFile] = {
      file: meta.file,
      relations: deriveRelations(meta.relations),
    };
  }

  return out;
}

function deriveRelations(
  relations:
    | AnyCollection[typeof QinoMeta]["relations"]
    | AnySingleton[typeof QinoMeta]["relations"],
): Array<RelationLockEntry> {
  const out: Array<RelationLockEntry> = [];

  for (const [field, declaration] of Object.entries(relations)) {
    if (!declaration) continue;
    const target =
      typeof declaration == "function" ? declaration() : declaration;
    const targetMeta = target[QinoMeta];
    const isSingleton = "file" in targetMeta;
    out.push({
      field,
      target: isSingleton ? targetMeta.file : targetMeta.directory,
      kind: isSingleton ? "singleton" : "collection",
      cardinality: field.includes(JSON_PATH_ARRAY) ? "many" : "one",
    });
  }

  return out;
}
