import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { QinoMeta, validate } from "../../lib";
import { parseFile } from "../../lib/parse/parse-file";
import type { AnySingleton } from "../../types";
import { assertFile } from "../../utils";
import { deriveRelations, type RelationLockEntry } from "./derive-relations";

type SingletonLockEntry = {
  file: string;
  relations: Array<RelationLockEntry>;
};

export async function buildSingletonsLock(
  contentFolderAbs: string,
  registry: Map<string, AnySingleton>,
) {
  const out: Record<string, SingletonLockEntry> = {};

  for (const [singletonFile, singleton] of registry.entries()) {
    const meta = singleton[QinoMeta];
    const absoluteFilePath = join(contentFolderAbs, meta.file);

    await assertFile(
      absoluteFilePath,
      `Singleton "${singletonFile}" not found at ${absoluteFilePath}.`,
    );

    const raw = await readFile(absoluteFilePath, "utf-8");

    parseFile({
      schema: meta.schema,
      data: raw,
      filePath: absoluteFilePath,
      validatorFn: validate,
    });

    out[singletonFile] = {
      file: meta.file,
      relations: deriveRelations(meta.relations),
    };
  }

  return out;
}
