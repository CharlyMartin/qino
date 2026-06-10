import { QinoPrimitiveMarker, QinoPrimitives } from "../../data/globals";
import type { AnySingleton, GenericPath, ResolveOption } from "../../types";
import { DUMMY_INSTANCE_ID } from "./dummy-config";

type MakeDummySingletonOptions = {
  file: GenericPath;
  data?: Record<string, unknown>;
  instanceId?: symbol;
};

export function makeDummySingleton({
  file,
  data = {},
  instanceId = DUMMY_INSTANCE_ID,
}: MakeDummySingletonOptions) {
  return {
    [QinoPrimitiveMarker]: {
      is: QinoPrimitives.singleton,
      instanceId,
      schema: {} as never,
      file,
      extension: ".json" as const,
      relations: {},
      resolveRelations: true as ResolveOption,
    },
    getData: async () => data as never,
  } as AnySingleton;
}
