import type { GenericPath } from "../../types";

type AssertNoOverlappingPathsParams = {
  collectionDirs: Array<GenericPath>;
  singletonFiles: Array<GenericPath>;
  treeDirs: Array<GenericPath>;
};

export function assertNoOverlappingPaths({
  collectionDirs,
  singletonFiles,
  treeDirs,
}: AssertNoOverlappingPathsParams) {
  assertUniquePairs(
    treeDirs,
    pathsOverlap,
    (a, b) =>
      `Tree directories overlap: "${a}" and "${b}". Each tree must own a distinct, non-overlapping directory.`,
  );

  assertCrossPairs(
    treeDirs,
    collectionDirs,
    pathsOverlap,
    (treeDir, collectionDir) =>
      `Tree directory "${treeDir}" overlaps with collection directory "${collectionDir}". Trees and collections must own distinct directories.`,
  );

  assertCrossPairs(
    singletonFiles,
    treeDirs,
    isFileInsideDir,
    (singletonFile, treeDir) =>
      `Singleton file "${singletonFile}" sits inside tree directory "${treeDir}". A tree owns its directory exclusively.`,
  );
}

type PredicateFn = (a: GenericPath, b: GenericPath) => boolean;
type MessageFn = (a: GenericPath, b: GenericPath) => string;

function assertUniquePairs(
  paths: Array<GenericPath>,
  predicate: PredicateFn,
  message: MessageFn,
) {
  for (let i = 0; i < paths.length; i += 1) {
    for (let j = i + 1; j < paths.length; j += 1) {
      if (predicate(paths[i], paths[j])) {
        throw new Error(message(paths[i], paths[j]));
      }
    }
  }
}

function assertCrossPairs(
  left: Array<GenericPath>,
  right: Array<GenericPath>,
  predicate: PredicateFn,
  message: MessageFn,
) {
  for (const leftPath of left) {
    for (const rightPath of right) {
      if (predicate(leftPath, rightPath)) {
        throw new Error(message(leftPath, rightPath));
      }
    }
  }
}

function pathsOverlap(a: string, b: string) {
  if (a == b) return true;
  const aSlash = a.endsWith("/") ? a : `${a}/`;
  const bSlash = b.endsWith("/") ? b : `${b}/`;
  return a.startsWith(bSlash) || b.startsWith(aSlash);
}

function isFileInsideDir(file: string, dir: string) {
  const dirSlash = dir.endsWith("/") ? dir : `${dir}/`;
  return file.startsWith(dirSlash);
}
