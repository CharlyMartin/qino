import { QinoPrimitiveMarker, QinoPrimitives } from "../data";
import type { AnyCollection, AnyItem, AnyTree } from "../types";

export function isTree(
  target: AnyCollection | AnyItem | AnyTree,
): target is AnyTree {
  return target[QinoPrimitiveMarker].is == QinoPrimitives.tree;
}
