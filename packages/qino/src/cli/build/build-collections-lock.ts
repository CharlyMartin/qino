import { readFile } from "node:fs/promises";
import { join } from "node:path";

import fg from "fast-glob";

import { COLLECTIONS_FOLDER_NAME, QinoMeta, ROOT_FOLDER_NAME } from "../../data";
import { parseFile } from "../../lib/parse/parse-file";
import { validate } from "../../lib/validate";
import type { AnyCollection, SupportedFileExtension } from "../../types";
import { deriveRelations, type RelationLockEntry } from "./derive-relations";

type CollectionLockEntry = {
  directory: string;
  extension: SupportedFileExtension;
  relations: Array<RelationLockEntry>;
};

export async function buildCollectionsLock(
  contentFolderAbs: string,
  registry: Map<string, AnyCollection>,
) {
  if (registry.size == 0) {
    throw new Error(
      `No collections found. Export a createCollection(...) result from each file in ${ROOT_FOLDER_NAME}/${COLLECTIONS_FOLDER_NAME}.`,
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
      const data = await readFile(filePath, "utf-8");

      parseFile({
        schema: meta.schema,
        data,
        filePath,
        validatorFn: validate,
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
