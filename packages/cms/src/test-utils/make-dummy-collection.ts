import { QinoPrimitiveMarker, QinoPrimitives } from "../data/globals";
import { paginate } from "../lib/pagination/paginate";
import type { AnyCollection } from "../types/collection";
import type { AnyRelations } from "../types/relations";
import type { ResolveDepths } from "../types/resolve";
import type {
  AnyEntry,
  ContentPath,
  PageOptions,
  Slug,
  SupportedFileExtension,
} from "../types/utils";
import { DUMMY_CONTENT_FOLDER, DUMMY_INSTANCE_ID } from "./dummy-config";

type MakeDummyCollectionOptions = {
  directory: ContentPath;
  extension: SupportedFileExtension;
  store?: Map<string, AnyEntry>;
  relations?: AnyRelations;
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
      contentFolder: DUMMY_CONTENT_FOLDER,
      schema: {} as never,
      directory,
      extension,
      relations,
      resolveDepth: {} as ResolveDepths,
      media: {},
      markdown: { stats: false, toc: false, media: [] },
      readEntries: async () => Array.from(store.values()) as never,
      readEntry: async (slug: Slug) => {
        const found = store.get(slug);
        if (!found) throw new Error(`ENOENT: ${directory}/${slug}`);
        return found as never;
      },
    },
    getEntries: async () => Array.from(store.values()) as never,
    getPaginatedEntries: async (page: number, { perPage }: PageOptions) =>
      paginate(Array.from(store.values()), {
        page,
        perPage,
        owner: `Collection "${directory}"`,
      }) as never,
    getAllSlugs: async () => Array.from(store.keys()).sort(),
    getEntry: async (slug: Slug) => {
      const found = store.get(slug);
      if (!found) throw new Error(`ENOENT: ${directory}/${slug}`);
      return found as never;
    },
  } as AnyCollection;
}
