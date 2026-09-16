import { QinoConfigMarker } from "../../data/globals";
import type { AnyQinoConfig } from "../../types/config";

export function isQinoConfig(value: unknown): value is AnyQinoConfig {
  return (
    typeof value == "object" &&
    value !== null &&
    QinoConfigMarker in value &&
    typeof value[QinoConfigMarker] == "object" &&
    value[QinoConfigMarker] !== null &&
    "instanceId" in value[QinoConfigMarker] &&
    typeof value[QinoConfigMarker].instanceId == "symbol"
  );
}
