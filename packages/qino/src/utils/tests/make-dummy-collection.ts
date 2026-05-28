import { QinoMeta } from "../../data/globals";
import type {
  AnyCollection,
  AnyEntry,
  GenericPath,
  RelationTarget,
  ResolveOption,
  SupportedFileExtension,
} from "../../types";

type MakeDummyCollectionOptions = {
  directory: GenericPath;
  extension: SupportedFileExtension;
  store?: Map<string, AnyEntry>;
  relations?: Record<string, RelationTarget | undefined>;
};

export function makeDummyCollection({
  directory,
  extension,
  store = new Map(),
  relations = {},
}: MakeDummyCollectionOptions) {
  return {
    [QinoMeta]: {
      is: "collection",
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
