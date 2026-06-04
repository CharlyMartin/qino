import { QinoMeta, QinoPrimitives } from "../data";
import type { AnyCollection, AnySingleton, AnyTree } from "../types";

export function isTree(
  target: AnyCollection | AnySingleton | AnyTree,
): target is AnyTree {
  return target[QinoMeta].is == QinoPrimitives.tree;
}
