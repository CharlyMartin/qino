import type { AnyCollection } from "../../types";
import { QinoMeta } from "../globals";

export type CTX = { sourceFilePath: string; relationKey: string };

export function slugFromRelationValue(
  value: string,
  targetCollection: AnyCollection,
  ctx: CTX,
) {
  const meta = targetCollection[QinoMeta];
  const expectedPrefix = `${meta.directory.replace(/^\//, "")}/`;

  const expectedExt = meta.extension;
  const normalized = value.startsWith("/") ? value.slice(1) : value;

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
