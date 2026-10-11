import { META_FIELD_NAME, QinoPrimitiveMarker } from "../../data/globals";
import { isCollection } from "../../lib/guards/is-collection";
import { isItem } from "../../lib/guards/is-item";
import type { AnyPrimitive } from "../../types/utils";
import { collectTreeSlugs } from "../build/collect-tree-slugs";

type Entry = Record<string, unknown> & {
  [META_FIELD_NAME]: { filePath: string };
};

/**
 * Reads every entry of a primitive through its schema, without views or
 * relation resolution. Each entry carries its `_meta.filePath`.
 */
export async function readValidatedEntries(primitive: AnyPrimitive) {
  const entries: Array<Entry> = isCollection(primitive)
    ? await primitive[QinoPrimitiveMarker].readEntries()
    : isItem(primitive)
      ? [await primitive[QinoPrimitiveMarker].readEntry()]
      : await Promise.all(
          (await collectTreeSlugs(primitive)).map((slug) =>
            primitive[QinoPrimitiveMarker].readEntry(slug),
          ),
        );

  return entries;
}
