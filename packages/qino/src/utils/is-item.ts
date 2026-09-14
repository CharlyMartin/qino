import { QinoPrimitiveMarker, QinoPrimitives } from "../data";
import type { AnyCollection, AnyItem, AnyTree } from "../types";

export function isItem(
  target: AnyCollection | AnyItem | AnyTree,
): target is AnyItem {
  return target[QinoPrimitiveMarker].is == QinoPrimitives.item;
}
