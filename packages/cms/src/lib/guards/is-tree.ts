import { QinoPrimitiveMarker, QinoPrimitives } from "../../data/globals";
import type { AnyCollection } from "../../types/collection";
import type { AnyItem } from "../../types/item";
import type { AnyTree } from "../../types/tree";

export function isTree(
  target: AnyCollection | AnyItem | AnyTree,
): target is AnyTree {
  return target[QinoPrimitiveMarker].is == QinoPrimitives.tree;
}
