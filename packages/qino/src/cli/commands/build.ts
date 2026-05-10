import { stat, writeFile, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createJiti } from "jiti";
import fg from "fast-glob";
import matter from "gray-matter";
import { z } from "zod";
import { ConfigSchema, type Config } from "../../runtime/create-config";
import { LockFileSchema, type LockFile } from "../../lib/lock-file";
import { getRegistry, clearRegistry } from "../../runtime/registry";
import { QinoMeta } from "../../runtime/symbols";
import type { AnyCollection } from "../../types";
import { validate } from "../../lib/standard-schema";

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

  const collectionsLock = await buildCollectionsLock(contentFolderAbs);

  const lock: LockFile = LockFileSchema.parse({
    qinoVersion: __QINO_VERSION__,
    config: {
      contentFolder: config.contentFolder,
      mediaFolder: config.mediaFolder,
    },
    collections: collectionsLock,
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
  clearRegistry();

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

type CollectionLockEntry = {
  path: string;
  extension: ".md" | ".mdx" | ".json";
  relations: Array<{
    field: string;
    target: string;
    cardinality: "one" | "many";
  }>;
};

async function buildCollectionsLock(
  contentFolderAbs: string,
): Promise<Record<string, CollectionLockEntry>> {
  const registry = getRegistry();
  if (registry.size == 0) {
    throw new Error(
      "No collections registered. Each qino/collections/*.ts file must call createCollection.",
    );
  }

  const out: Record<string, CollectionLockEntry> = {};

  for (const [collectionPath, collection] of registry.entries()) {
    const meta = collection[QinoMeta];
    const collectionDir = join(contentFolderAbs, meta.path);

    const relPaths = await fg(`**/*${meta.extension}`, { cwd: collectionDir });
    if (relPaths.length == 0) {
      throw new Error(
        `Collection "${collectionPath}" (path: ${meta.path}) has no entries. A collection must have at least one entry.`,
      );
    }

    const validatedEntries: Array<Record<string, unknown>> = [];
    for (const relPath of relPaths) {
      const filePath = join(collectionDir, relPath);
      const raw = await readFile(filePath, "utf-8");
      const data =
        meta.extension == ".json"
          ? JSON.parse(raw)
          : (() => {
              const parsed = matter(raw);
              return { markdown: parsed.content, ...parsed.data };
            })();
      const validated = validate(meta.schema, data, filePath) as Record<
        string,
        unknown
      >;
      validatedEntries.push(validated);
    }

    const relations = deriveRelations(
      collectionPath,
      meta.relations,
      validatedEntries,
    );

    out[collectionPath] = {
      path: meta.path,
      extension: meta.extension,
      relations,
    };
  }

  return out;
}

function deriveRelations(
  collectionPath: string,
  relations: AnyCollection[typeof QinoMeta]["relations"],
  entries: Array<Record<string, unknown>>,
): CollectionLockEntry["relations"] {
  const out: CollectionLockEntry["relations"] = [];

  for (const [field, declaration] of Object.entries(relations)) {
    if (!declaration) continue;
    const target =
      typeof declaration == "function" ? declaration() : declaration;
    const targetPath = target[QinoMeta].path;

    let cardinality: "one" | "many" | undefined;
    for (const entry of entries) {
      const value = entry[field];
      if (value == undefined) continue;
      cardinality = Array.isArray(value) ? "many" : "one";
      break;
    }

    if (!cardinality) {
      throw new Error(
        `${collectionPath}.${field} is declared as a relation but no entry sets it — add a sample entry that exercises this field, or remove the relation declaration.`,
      );
    }

    out.push({ field, target: targetPath, cardinality });
  }

  return out;
}
