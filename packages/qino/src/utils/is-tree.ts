import { QinoPrimitiveMarker, QinoPrimitives } from "../data";
import type { AnyCollection, AnySingleton, AnyTree } from "../types";

export function isTree(
  target: AnyCollection | AnySingleton | AnyTree,
): target is AnyTree {
  return target[QinoPrimitiveMarker].is == QinoPrimitives.tree;
}
