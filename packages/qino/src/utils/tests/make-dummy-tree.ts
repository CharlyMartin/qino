import { QinoMeta, QinoPrimitives } from "../../data/globals";
import type { AnyTree, GenericPath, ResolveOption } from "../../types";

type MakeDummyTreeOptions = {
  directory: GenericPath;
};

// Should allow all extensions.
export function makeDummyTree({ directory }: MakeDummyTreeOptions) {
  return {
    [QinoMeta]: {
      is: QinoPrimitives.tree,
      schema: {} as never,
      directory,
      extension: ".md" as const,
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
