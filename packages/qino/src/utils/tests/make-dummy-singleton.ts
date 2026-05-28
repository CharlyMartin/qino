import { QinoMeta, QinoPrimitives } from "../../data/globals";
import type { AnySingleton, GenericPath, ResolveOption } from "../../types";

type MakeDummySingletonOptions = {
  file: GenericPath;
  data?: Record<string, unknown>;
};

export function makeDummySingleton({
  file,
  data = {},
}: MakeDummySingletonOptions) {
  return {
    [QinoMeta]: {
      is: QinoPrimitives.singleton,
      schema: {} as never,
      file,
      extension: ".json" as const,
      relations: {},
      resolveRelations: true as ResolveOption,
    },
    getData: async () => data as never,
  } as AnySingleton;
}
