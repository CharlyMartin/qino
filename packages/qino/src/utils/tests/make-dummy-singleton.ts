import { QinoMeta } from "../../data/globals";
import type { AnySingleton, GenericPath } from "../../types";
import type { ResolveOption } from "../../types/resolve";

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
      is: "singleton",
      schema: {} as never,
      file,
      extension: ".json" as const,
      relations: {},
      resolveRelations: true as ResolveOption,
    },
    getData: async () => data as never,
  } as AnySingleton;
}
