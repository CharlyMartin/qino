import { join } from "path";
import { QinoMeta, validateJsonFile, validateMarkdownFile } from "../../lib";
import { singletonRegistry } from "../../runtime/singletons/registry";
import { assertFile } from "../../utils";
import { readFile } from "fs/promises";
import { deriveRelations, type RelationLockEntry } from "./derive-relations";

type SingletonLockEntry = {
  file: string;
  relations: Array<RelationLockEntry>;
};

export async function buildSingletonsLock(contentFolderAbs: string) {
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
