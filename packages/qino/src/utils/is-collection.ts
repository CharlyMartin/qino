import { QinoPrimitiveMarker, QinoPrimitives } from "../data";
import type { AnyCollection, AnySingleton, AnyTree } from "../types";

export function isCollection(
  target: AnyCollection | AnySingleton | AnyTree,
): target is AnyCollection {
  return target[QinoPrimitiveMarker].is == QinoPrimitives.collection;
}
