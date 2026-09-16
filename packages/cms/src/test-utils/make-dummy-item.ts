import { QinoPrimitiveMarker, QinoPrimitives } from "../data/globals";
import type { AnyItem } from "../types/item";
import type { ResolveOption } from "../types/resolve";
import type { GenericPath } from "../types/utils";
import { DUMMY_INSTANCE_ID } from "./dummy-config";

type MakeDummyItemOptions = {
  file: GenericPath;
  data?: Record<string, unknown>;
  instanceId?: symbol;
};

export function makeDummyItem({
  file,
  data = {},
  instanceId = DUMMY_INSTANCE_ID,
}: MakeDummyItemOptions) {
  return {
    [QinoPrimitiveMarker]: {
      is: QinoPrimitives.item,
      instanceId,
      schema: {} as never,
      file,
      extension: ".json" as const,
      relations: {},
      resolveRelations: false as ResolveOption,
      readData: async () => data as never,
    },
    getData: async () => data as never,
  } as AnyItem;
}
