import { QinoPrimitiveMarker, QinoPrimitives } from "../data";
import type { AnyCollection, AnySingleton, AnyTree } from "../types";

export function isSingleton(
  target: AnyCollection | AnySingleton | AnyTree,
): target is AnySingleton {
  return target[QinoPrimitiveMarker].is == QinoPrimitives.singleton;
}
