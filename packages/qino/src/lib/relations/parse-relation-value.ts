import { QinoMeta } from "../../data/globals";
import type { AnyCollection, AnySingleton } from "../../types";
import { removeLeadingSlash } from "../../utils";

export type Context = { sourceFilePath: string; relationKey: string };

export function parseRelationValue(
  value: string,
  target: AnyCollection | AnySingleton,
  ctx: Context,
) {
  const normalized = removeLeadingSlash(value);
  const meta = target[QinoMeta];

  if (meta.is == "singleton") {
    const expected = removeLeadingSlash(meta.file);

    if (normalized != expected) {
      throw new Error(
        `Relation "${ctx.relationKey}" in ${ctx.sourceFilePath}: expected value "${expected}" (target singleton "${meta.file}"), got "${value}".`,
      );
    }

    return normalized; // value is irrelevant for singletons, since they always resolve to the same file
  }

  const expectedPrefix = `${removeLeadingSlash(meta.directory)}/`;
  const expectedExt = meta.extension;

  if (!normalized.startsWith(expectedPrefix)) {
    throw new Error(
      `Relation "${ctx.relationKey}" in ${ctx.sourceFilePath}: expected value under "${expectedPrefix}" (target collection "${meta.directory}"), got "${value}".`,
    );
  }

  if (!normalized.endsWith(expectedExt)) {
    throw new Error(
      `Relation "${ctx.relationKey}" in ${ctx.sourceFilePath}: expected value ending with "${expectedExt}" (target collection "${meta.directory}"), got "${value}".`,
    );
  }

  return normalized.slice(
    expectedPrefix.length,
    normalized.length - expectedExt.length,
  );
}
