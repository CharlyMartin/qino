import { QinoMeta, QinoPrimitives } from "../../data/globals";
import type { QinoConfig } from "../../runtime/qino/create-qino";
import type {
  AnyTree,
  GenericPath,
  ResolveOption,
  SupportedFileExtension,
} from "../../types";
import { DUMMY_CONFIG, DUMMY_INSTANCE_ID } from "./dummy-config";

type MakeDummyTreeOptions = {
  directory: GenericPath;
  extension: SupportedFileExtension;
  instanceId?: symbol;
  config?: QinoConfig;
};

export function makeDummyTree({
  directory,
  extension,
  instanceId = DUMMY_INSTANCE_ID,
  config = DUMMY_CONFIG,
}: MakeDummyTreeOptions) {
  return {
    [QinoMeta]: {
      is: QinoPrimitives.tree,
      instanceId,
      config,
      schema: {} as never,
      directory,
      extension,
      titleField: "title",
      orderFileName: "_order.json",
      relations: {},
      resolveRelations: true as ResolveOption,
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
