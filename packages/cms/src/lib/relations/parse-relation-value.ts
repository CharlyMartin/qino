import { QinoPrimitives } from "../../data/globals";
import type { AnyPrimitiveMeta } from "../../types/utils";
import { toContentPath } from "../paths/to-content-path";
import { toDirectoryPrefix } from "../paths/to-directory-prefix";

export type Context = { sourceFilePath: string; relationKey: string };

export function parseRelationValue(
  value: string,
  targetMeta: AnyPrimitiveMeta,
  ctx: Context,
) {
  const prefix = `Relation "${ctx.relationKey}" in ${ctx.sourceFilePath}`;

  if (value.startsWith("/")) {
    throw new Error(
      `${prefix}: value "${value}" must be relative to contentFolder, without a leading "/". Use "${value.replace(/^\/+/, "")}".`,
    );
  }

  if (targetMeta.is == QinoPrimitives.item) {
    const expected = targetMeta.file;
    const normalized = toContentPath(value, targetMeta.contentFolder, expected);

    if (normalized != expected) {
      throw new Error(
        `${prefix}: expected value "${expected}" (target item "${targetMeta.file}"), got "${value}".`,
      );
    }

    return normalized; // value is irrelevant for items, since they always resolve to the same file
  }

  const expectedPrefix = toDirectoryPrefix(targetMeta.directory);
  const expectedExt = targetMeta.extension;
  const normalized = toContentPath(
    value,
    targetMeta.contentFolder,
    expectedPrefix,
  );

  if (!normalized.startsWith(expectedPrefix)) {
    throw new Error(
      `${prefix}: expected value under "${expectedPrefix}" (target ${targetMeta.is} "${targetMeta.directory}"), got "${value}".`,
    );
  }

  if (!normalized.endsWith(expectedExt)) {
    throw new Error(
      `${prefix}: expected value ending with "${expectedExt}" (target ${targetMeta.is} "${targetMeta.directory}"), got "${value}".`,
    );
  }

  return normalized.slice(
    expectedPrefix.length,
    normalized.length - expectedExt.length,
  );
}
