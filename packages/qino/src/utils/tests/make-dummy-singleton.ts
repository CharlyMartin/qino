import { QinoMeta, QinoPrimitives } from "../../data/globals";
import type { QinoConfig } from "../../runtime/qino/create-qino";
import type { AnySingleton, GenericPath, ResolveOption } from "../../types";
import { DUMMY_CONFIG, DUMMY_INSTANCE_ID } from "./dummy-config";

type MakeDummySingletonOptions = {
  file: GenericPath;
  data?: Record<string, unknown>;
  instanceId?: symbol;
  config?: QinoConfig;
};

export function makeDummySingleton({
  file,
  data = {},
  instanceId = DUMMY_INSTANCE_ID,
  config = DUMMY_CONFIG,
}: MakeDummySingletonOptions) {
  return {
    [QinoMeta]: {
      is: QinoPrimitives.singleton,
      instanceId,
      config,
      schema: {} as never,
      file,
      extension: ".json" as const,
      relations: {},
      resolveRelations: true as ResolveOption,
    },
    getData: async () => data as never,
  } as AnySingleton;
}
