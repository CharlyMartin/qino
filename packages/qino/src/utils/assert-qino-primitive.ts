import { QinoPrimitiveMarker } from "../data/globals";
import type { AnyCollection } from "../types/collection";
import type { AnyItem } from "../types/item";
import type { AnyTree } from "../types/tree";

export function assertQinoPrimitive(
  value: unknown,
  msg?: string,
): asserts value is AnyCollection | AnyItem | AnyTree {
  const isValid =
    typeof value == "object" &&
    value !== null &&
    QinoPrimitiveMarker in value &&
    typeof value[QinoPrimitiveMarker] == "object" &&
    value[QinoPrimitiveMarker] !== null &&
    "is" in value[QinoPrimitiveMarker] &&
    typeof value[QinoPrimitiveMarker].is == "string";

  if (!isValid) {
    throw new Error(msg || `${value} is not a valid Qino primitive`);
  }
}
