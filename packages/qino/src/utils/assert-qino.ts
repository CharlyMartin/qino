import type { AnyQinoConfig } from "../types/config";
import { isQinoConfig } from "./is-qino-config";

export function assertQino(
  value: unknown,
  msg?: string,
): asserts value is AnyQinoConfig {
  if (!isQinoConfig(value)) {
    throw new Error(msg || `${value} is not a valid Qino instance`);
  }
}
