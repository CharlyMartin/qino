import { QinoPrimitives } from "../../data";
import type { AnyCollectionMeta, AnySingletonMeta } from "../../types";
import { removeLeadingSlash } from "../../utils";

export type Context = { sourceFilePath: string; relationKey: string };

export function parseRelationValue(
  value: string,
  targetMeta: AnyCollectionMeta | AnySingletonMeta,
  ctx: Context,
) {
  const normalized = removeLeadingSlash(value);

  if (targetMeta.is == QinoPrimitives.singleton) {
    const expected = removeLeadingSlash(targetMeta.file);

    if (normalized != expected) {
      throw new Error(
        `Relation "${ctx.relationKey}" in ${ctx.sourceFilePath}: expected value "${expected}" (target singleton "${targetMeta.file}"), got "${value}".`,
      );
    }

    return normalized; // value is irrelevant for singletons, since they always resolve to the same file
  }

  const expectedPrefix = `${removeLeadingSlash(targetMeta.directory)}/`;
  const expectedExt = targetMeta.extension;

  if (!normalized.startsWith(expectedPrefix)) {
    throw new Error(
      `Relation "${ctx.relationKey}" in ${ctx.sourceFilePath}: expected value under "${expectedPrefix}" (target collection "${targetMeta.directory}"), got "${value}".`,
    );
  }

  if (!normalized.endsWith(expectedExt)) {
    throw new Error(
      `Relation "${ctx.relationKey}" in ${ctx.sourceFilePath}: expected value ending with "${expectedExt}" (target collection "${targetMeta.directory}"), got "${value}".`,
    );
  }

  return normalized.slice(
    expectedPrefix.length,
    normalized.length - expectedExt.length,
  );
}
