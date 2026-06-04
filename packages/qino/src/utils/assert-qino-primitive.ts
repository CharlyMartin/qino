import { QinoMeta } from "../data";
import type { AnyCollection, AnySingleton, AnyTree } from "../types";

export function assertQinoPrimitive(
  value: unknown,
  msg?: string,
): asserts value is AnyCollection | AnySingleton | AnyTree {
  const isValid =
    typeof value == "object" &&
    value !== null &&
    QinoMeta in value &&
    typeof value[QinoMeta] == "object" &&
    value[QinoMeta] !== null &&
    "is" in value[QinoMeta] &&
    typeof value[QinoMeta].is == "string";

  if (!isValid) {
    throw new Error(msg || `${value} is not a valid Qino primitive`);
  }
}
