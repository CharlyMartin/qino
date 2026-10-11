import { QinoPrimitiveMarker } from "../../data/globals";
import { isCollection } from "../../lib/guards/is-collection";
import { isItem } from "../../lib/guards/is-item";
import type { AnyPrimitive } from "../../types/utils";
import { collectTreeSlugs } from "../build/collect-tree-slugs";

/**
 * Reads every entry of a primitive through its schema, without views or
 * relation resolution. Each entry carries its `_meta.filePath`.
 */
export async function readValidatedEntries(primitive: AnyPrimitive) {
  if (isCollection(primitive)) {
    return primitive[QinoPrimitiveMarker].readEntries();
  }

  if (isItem(primitive)) {
    return [await primitive[QinoPrimitiveMarker].readEntry()];
  }

  const slugs = await collectTreeSlugs(primitive);
  return Promise.all(
    slugs.map((slug) => primitive[QinoPrimitiveMarker].readEntry(slug)),
  );
}
