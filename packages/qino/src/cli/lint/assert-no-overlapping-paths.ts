import { QinoPrimitives } from "../../data";
import { describePathConflict, type PrimitivePath } from "../../lib";
import type { GenericPath } from "../../types";

type AssertNoOverlappingPathsParams = {
  collectionDirs: Array<GenericPath>;
  itemFiles: Array<GenericPath>;
  treeDirs: Array<GenericPath>;
};

export function assertNoOverlappingPaths({
  collectionDirs,
  itemFiles,
  treeDirs,
}: AssertNoOverlappingPathsParams) {
  const paths: Array<PrimitivePath> = [
    ...collectionDirs.map((path) => ({
      kind: QinoPrimitives.collection,
      path,
    })),
    ...treeDirs.map((path) => ({ kind: QinoPrimitives.tree, path })),
    ...itemFiles.map((path) => ({ kind: QinoPrimitives.item, path })),
  ];

  for (let i = 0; i < paths.length; i += 1) {
    for (let j = i + 1; j < paths.length; j += 1) {
      const message = describePathConflict(paths[i], paths[j]);
      if (message) throw new Error(message);
    }
  }
}
