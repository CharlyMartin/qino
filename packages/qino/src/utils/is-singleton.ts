import { QinoMeta } from "../data";
import type { AnyCollection, AnySingleton } from "../types";

export function isSingleton(
  target: AnyCollection | AnySingleton,
): target is AnySingleton {
  return target[QinoMeta].is == "singleton";
}
