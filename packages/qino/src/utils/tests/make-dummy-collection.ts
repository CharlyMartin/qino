import { QinoPrimitiveMarker, QinoPrimitives } from "../../data/globals";
import type {
  AnyCollection,
  AnyEntry,
  GenericPath,
  RelationTarget,
  ResolveOption,
  SupportedFileExtension,
} from "../../types";
import type { Slug } from "../../types/utils";
import { DUMMY_INSTANCE_ID } from "./dummy-config";

type MakeDummyCollectionOptions = {
  directory: GenericPath;
  extension: SupportedFileExtension;
  store?: Map<string, AnyEntry>;
  relations?: Record<string, RelationTarget | undefined>;
  instanceId?: symbol;
};

export function makeDummyCollection({
  directory,
  extension,
  store = new Map(),
  relations = {},
  instanceId = DUMMY_INSTANCE_ID,
}: MakeDummyCollectionOptions) {
  return {
    [QinoPrimitiveMarker]: {
      is: QinoPrimitives.collection,
      instanceId,
      schema: {} as never,
      directory,
      extension,
      relations,
      resolveRelations: true as ResolveOption,
    },
    getAll: async () => Array.from(store.values()) as never,
    getOne: async (slug: Slug) => {
      const found = store.get(slug);
      if (!found) throw new Error(`ENOENT: ${directory}/${slug}`);
      return found as never;
    },
  } as AnyCollection;
}
