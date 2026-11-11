import { QinoPrimitiveMarker, QinoPrimitives } from "../data/globals";
import type { AnyItem } from "../types/item";
import type { ResolveDepths } from "../types/resolve";
import type { ContentPath } from "../types/utils";
import { DUMMY_CONTENT_FOLDER, DUMMY_INSTANCE_ID } from "./dummy-config";

type MakeDummyItemOptions = {
  file: ContentPath;
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
      contentFolder: DUMMY_CONTENT_FOLDER,
      schema: {} as never,
      file,
      extension: ".json" as const,
      relations: {},
      resolveDepth: {} as ResolveDepths,
      media: {},
      markdown: { stats: false, toc: false, media: [] },
      readEntry: async () => data as never,
    },
    getEntry: async () => data as never,
  } as AnyItem;
}
