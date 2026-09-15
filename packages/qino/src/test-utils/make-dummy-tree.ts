import { QinoPrimitiveMarker, QinoPrimitives } from "../data/globals";
import type { RelationTarget } from "../types/relations";
import type { ResolveOption } from "../types/resolve";
import type { AnyTree } from "../types/tree";
import type {
  AnyEntry,
  GenericPath,
  SupportedFileExtension,
} from "../types/utils";
import { DUMMY_INSTANCE_ID } from "./dummy-config";

type MakeDummyTreeOptions = {
  directory: GenericPath;
  extension: SupportedFileExtension;
  instanceId?: symbol;
  store?: Map<string, AnyEntry>;
  relations?: Record<string, RelationTarget | undefined>;
};

export function makeDummyTree({
  directory,
  extension,
  instanceId = DUMMY_INSTANCE_ID,
  store = new Map(),
  relations = {},
}: MakeDummyTreeOptions) {
  return {
    [QinoPrimitiveMarker]: {
      is: QinoPrimitives.tree,
      instanceId,
      schema: {} as never,
      directory,
      extension,
      titleField: "title",
      orderFileName: "_order.json",
      relations,
      resolveRelations: false as ResolveOption,
      readEntry: async (slug: string) => {
        const found = store.get(slug);
        if (!found) throw new Error(`ENOENT: ${directory}/${slug}`);
        return found as never;
      },
    },
    getTree: (async () => []) as never,
    getFlatTree: async () => [],
    getEntry: (async () => {
      throw new Error("not implemented");
    }) as never,
    getNextNode: async () => null,
    getPreviousNode: async () => null,
  } as AnyTree;
}
