import { QinoMeta, QinoPrimitives } from "../../data/globals";
import type { QinoConfig } from "../../runtime/qino/create-qino";
import type {
  AnyCollection,
  AnyEntry,
  GenericPath,
  RelationTarget,
  ResolveOption,
  SupportedFileExtension,
} from "../../types";
import { DUMMY_CONFIG, DUMMY_INSTANCE_ID } from "./dummy-config";

type MakeDummyCollectionOptions = {
  directory: GenericPath;
  extension: SupportedFileExtension;
  store?: Map<string, AnyEntry>;
  relations?: Record<string, RelationTarget | undefined>;
  instanceId?: symbol;
  config?: QinoConfig;
};

export function makeDummyCollection({
  directory,
  extension,
  store = new Map(),
  relations = {},
  instanceId = DUMMY_INSTANCE_ID,
  config = DUMMY_CONFIG,
}: MakeDummyCollectionOptions) {
  return {
    [QinoMeta]: {
      is: QinoPrimitives.collection,
      instanceId,
      config,
      schema: {} as never,
      directory,
      extension,
      relations,
      resolveRelations: true as ResolveOption,
    },
    getAll: async () => Array.from(store.values()) as never,
    getOne: async (slug: string) => {
      const found = store.get(slug);
      if (!found) throw new Error(`ENOENT: ${directory}/${slug}`);
      return found as never;
    },
  } as AnyCollection;
}
