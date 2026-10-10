import { QinoPrimitiveMarker } from "../../data/globals";
import { isItem } from "../../lib/guards/is-item";
import type { AnyPrimitive } from "../../types/utils";

/**
 * Stable, unique id for a primitive in `config.json`: its `file` for items,
 * its `directory` for collections and trees (`qino lint` asserts no overlap).
 */
export function getPrimitiveId(primitive: AnyPrimitive) {
  return isItem(primitive)
    ? primitive[QinoPrimitiveMarker].file
    : primitive[QinoPrimitiveMarker].directory;
}
