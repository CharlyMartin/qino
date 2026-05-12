import { readFile } from "node:fs/promises";
import { join } from "node:path";

import fg from "fast-glob";

import {
  COLLECTIONS_FOLDER_NAME,
  QinoMeta,
  ROOT_FOLDER_NAME,
  validateJsonFile,
  validateMarkdownFile,
} from "../../lib";
import { collectionRegistry } from "../../runtime/collections/registry";
import type { SupportedFileExtension } from "../../types";
import { deriveRelations, type RelationLockEntry } from "./derive-relations";

type CollectionLockEntry = {
  directory: string;
  extension: SupportedFileExtension;
  relations: Array<RelationLockEntry>;
};

export async function buildCollectionsLock(contentFolderAbs: string) {
  const registry = collectionRegistry.getRegistry();

  if (registry.size == 0) {
    throw new Error(
      `No collections registered. Call createCollection for each ${ROOT_FOLDER_NAME}/${COLLECTIONS_FOLDER_NAME} directories.`,
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
