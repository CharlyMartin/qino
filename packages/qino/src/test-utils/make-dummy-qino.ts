import { QinoConfigMarker } from "../data/globals";
import type { QinoConfig } from "../runtime/qino/create-qino";
import type { AnyQinoConfig } from "../types/config";
import { DUMMY_CONFIG, DUMMY_INSTANCE_ID } from "./dummy-config";

type MakeDummyQinoOptions = {
  instanceId?: symbol;
  config?: QinoConfig;
};

export function makeDummyQino({
  instanceId = DUMMY_INSTANCE_ID,
  config = DUMMY_CONFIG,
}: MakeDummyQinoOptions = {}) {
  return {
    [QinoConfigMarker]: {
      instanceId,
      ...config,
    },
    defineCollection: (() => {}) as never,
    defineItem: (() => {}) as never,
    defineTree: (() => {}) as never,
  } as AnyQinoConfig;
}
