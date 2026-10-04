import { QinoPrimitives } from "../../data/globals";
import {
  describePathConflict,
  type PrimitivePath,
} from "../../lib/paths/describe-path-conflict";
import type { ContentPath } from "../../types/utils";

type AssertNoOverlappingPathsParams = {
  collectionDirs: Array<ContentPath>;
  itemFiles: Array<ContentPath>;
  treeDirs: Array<ContentPath>;
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

  for (const [index, first] of paths.entries()) {
    for (const second of paths.slice(index + 1)) {
      const message = describePathConflict(first, second);
      if (message) throw new Error(message);
    }
  }
}
