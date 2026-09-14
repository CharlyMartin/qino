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
      resolveRelations: false as ResolveOption,
      readAll: async () => Array.from(store.values()) as never,
      readOne: async (slug: Slug) => {
        const found = store.get(slug);
        if (!found) throw new Error(`ENOENT: ${directory}/${slug}`);
        return found as never;
      },
    },
    getMany: async () => Array.from(store.values()) as never,
    getAllSlugs: async () => Array.from(store.keys()).sort(),
    getOne: async (slug: Slug) => {
      const found = store.get(slug);
      if (!found) throw new Error(`ENOENT: ${directory}/${slug}`);
      return found as never;
    },
  } as AnyCollection;
}
