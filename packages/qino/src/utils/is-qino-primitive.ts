import { QinoPrimitiveMarker, QinoPrimitives } from "../data";
import type { AnyPrimitive } from "../types/utils";

export function isQinoPrimitive(value: unknown): value is AnyPrimitive {
  return (
    typeof value == "object" &&
    value !== null &&
    QinoPrimitiveMarker in value &&
    typeof value[QinoPrimitiveMarker] == "object" &&
    value[QinoPrimitiveMarker] !== null &&
    "is" in value[QinoPrimitiveMarker] &&
    typeof value[QinoPrimitiveMarker].is == "string" &&
    // biome-ignore lint/suspicious/noExplicitAny: value[QinoPrimitiveMarker].is is a string, as checked above
    Object.values(QinoPrimitives).includes(value[QinoPrimitiveMarker].is as any)
  );
}
