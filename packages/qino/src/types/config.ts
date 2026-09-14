import type { QinoConfigMarker } from "../data";
import type { QinoContext } from "../runtime/qino/create-qino";

export type AnyQinoConfig = {
  readonly [QinoConfigMarker]: QinoContext;
  defineCollection(params: never): unknown;
  defineItem(params: never): unknown;
  defineTree(params: never): unknown;
};
