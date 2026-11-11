import nodePath from "node:path";

import { parseRelationValue as readRelationValue } from "@qino/tooling/relations";

import { QinoPrimitives } from "../../data/globals";
import type { AnyPrimitiveMeta } from "../../types/utils";

export type Context = {
  sourceFilePath: string;
  relationKey: string;
  /** The raw value, when a `parse` callback turned it into `value`. */
  parsedFrom?: string;
};

/**
 * Reads a relation value with `@qino/tooling`'s rules, the ones the cloud UI
 * reads it with, against the target's `contentFolder` resolved from the
 * working directory.
 */
export function parseRelationValue(
  value: string,
  targetMeta: AnyPrimitiveMeta,
  ctx: Context,
) {
  const parsedFrom = ctx.parsedFrom
    ? ` (parsed from ${JSON.stringify(ctx.parsedFrom)})`
    : "";
  const target =
    targetMeta.is == QinoPrimitives.item
      ? { kind: targetMeta.is, file: targetMeta.file }
      : {
          kind: targetMeta.is,
          directory: targetMeta.directory,
          extension: targetMeta.extension,
        };

  return readRelationValue(value, target, {
    contentFolder: nodePath.resolve(targetMeta.contentFolder),
    owner: `Relation "${ctx.relationKey}" in ${ctx.sourceFilePath}${parsedFrom}`,
  });
}
