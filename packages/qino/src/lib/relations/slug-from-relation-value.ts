import { QinoMeta } from "../globals";
import type { AnyCollection, AnySingleton } from "../../types";

export type CTX = { sourceFilePath: string; relationKey: string };

export function slugFromRelationValue(
  value: string,
  targetCollection: AnyCollection | AnySingleton,
  ctx: CTX,
) {
  const meta = targetCollection[QinoMeta];
  const normalized = value.startsWith("/") ? value.slice(1) : value;

  if ("file" in meta) {
    const expected = meta.file.replace(/^\//, "");
    if (normalized != expected) {
      throw new Error(
        `Relation "${ctx.relationKey}" in ${ctx.sourceFilePath}: expected value "${expected}" (target singleton "${meta.file}"), got "${value}".`,
      );
    }
    return "";
  }

  const expectedPrefix = `${meta.directory.replace(/^\//, "")}/`;
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
