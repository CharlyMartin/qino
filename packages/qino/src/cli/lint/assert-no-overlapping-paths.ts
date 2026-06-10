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
  // Within-type: no two primitives of the same kind may own overlapping paths.
  assertUniquePairs(
    collectionDirs,
    pathsOverlap,
    (a, b) =>
      `Collection directories overlap: "${a}" and "${b}". Each collection must own a distinct, non-overlapping directory.`,
  );

  assertUniquePairs(
    treeDirs,
    pathsOverlap,
    (a, b) =>
      `Tree directories overlap: "${a}" and "${b}". Each tree must own a distinct, non-overlapping directory.`,
  );

  assertUniquePairs(
    singletonFiles,
    samePath,
    (a) =>
      `Two singletons target the same file: "${a}". Each singleton must own a distinct file.`,
  );

  // Cross-type: directories and files of different kinds must not overlap.
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

  assertCrossPairs(
    singletonFiles,
    collectionDirs,
    isFileInsideDir,
    (singletonFile, collectionDir) =>
      `Singleton file "${singletonFile}" sits inside collection directory "${collectionDir}". A collection owns its directory exclusively.`,
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

function samePath(a: string, b: string) {
  return a == b;
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
