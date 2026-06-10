import type { QinoConfigMarker } from "../data";
import type { QinoContext } from "../runtime/qino/create-qino";

export type AnyQinoConfig = {
  readonly [QinoConfigMarker]: QinoContext;
  createCollection(params: never): unknown;
  createSingleton(params: never): unknown;
  createTree(params: never): unknown;
};
