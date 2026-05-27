import { QinoMeta } from "../data";
import type { AnyCollection, AnySingleton } from "../types";

export function isCollection(
  target: AnyCollection | AnySingleton,
): target is AnyCollection {
  return target[QinoMeta].is == "collection";
}
