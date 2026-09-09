import { QinoPrimitiveMarker, QinoPrimitives } from "../../data/globals";
import type {
  AnyTree,
  GenericPath,
  ResolveOption,
  SupportedFileExtension,
} from "../../types";
import { DUMMY_INSTANCE_ID } from "./dummy-config";

type MakeDummyTreeOptions = {
  directory: GenericPath;
  extension: SupportedFileExtension;
  instanceId?: symbol;
};

export function makeDummyTree({
  directory,
  extension,
  instanceId = DUMMY_INSTANCE_ID,
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
      relations: {},
      resolveRelations: false as ResolveOption,
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
