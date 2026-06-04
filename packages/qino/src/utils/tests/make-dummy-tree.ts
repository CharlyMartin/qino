import { QinoMeta, QinoPrimitives } from "../../data/globals";
import type {
  AnyTree,
  GenericPath,
  ResolveOption,
  SupportedFileExtension,
} from "../../types";

type MakeDummyTreeOptions = {
  directory: GenericPath;
  extension: SupportedFileExtension;
};

export function makeDummyTree({ directory, extension }: MakeDummyTreeOptions) {
  return {
    [QinoMeta]: {
      is: QinoPrimitives.tree,
      schema: {} as never,
      directory,
      extension,
      titleField: "title",
      orderFileName: "_order.json",
      relations: {},
      resolveRelations: true as ResolveOption,
    },
    getTree: (async () => []) as never,
    getEntry: (async () => {
      throw new Error("not implemented");
    }) as never,
  } as AnyTree;
}
