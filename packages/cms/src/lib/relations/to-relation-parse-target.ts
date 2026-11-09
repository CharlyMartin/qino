import { QinoPrimitives } from "../../data/globals";
import type { AnyPrimitiveMeta } from "../../types/utils";

/** The part of a target's meta a relation `parse` callback needs. */
export function toRelationParseTarget(meta: AnyPrimitiveMeta) {
  if (meta.is == QinoPrimitives.item) {
    return { is: meta.is, contentFolder: meta.contentFolder, file: meta.file };
  }

  return {
    is: meta.is,
    contentFolder: meta.contentFolder,
    directory: meta.directory,
    extension: meta.extension,
  };
}
