import type { AnyCollection, AnySingleton, AnyTree } from "../../types";

// There must be an easier way to do this?
export function assertNoOverlappingPaths(
  collections: Map<string, AnyCollection>,
  singletons: Map<string, AnySingleton>,
  trees: Map<string, AnyTree>,
) {
  const collectionDirs = [...collections.keys()];
  const singletonFiles = [...singletons.keys()];
  const treeDirs = [...trees.keys()];

  for (let i = 0; i < treeDirs.length; i += 1) {
    for (let j = i + 1; j < treeDirs.length; j += 1) {
      if (pathsOverlap(treeDirs[i], treeDirs[j])) {
        throw new Error(
          `Tree directories overlap: "${treeDirs[i]}" and "${treeDirs[j]}". Each tree must own a distinct, non-overlapping directory.`,
        );
      }
    }
  }

  for (const treeDir of treeDirs) {
    for (const collectionDir of collectionDirs) {
      if (pathsOverlap(treeDir, collectionDir)) {
        throw new Error(
          `Tree directory "${treeDir}" overlaps with collection directory "${collectionDir}". Trees and collections must own distinct directories.`,
        );
      }
    }
  }

  for (const treeDir of treeDirs) {
    for (const singletonFile of singletonFiles) {
      if (isFileInsideDir(singletonFile, treeDir)) {
        throw new Error(
          `Singleton file "${singletonFile}" sits inside tree directory "${treeDir}". A tree owns its directory exclusively.`,
        );
      }
    }
  }
}

function pathsOverlap(a: string, b: string) {
  if (a === b) return true;
  const aSlash = a.endsWith("/") ? a : `${a}/`;
  const bSlash = b.endsWith("/") ? b : `${b}/`;
  return a.startsWith(bSlash) || b.startsWith(aSlash);
}

function isFileInsideDir(file: string, dir: string) {
  const dirSlash = dir.endsWith("/") ? dir : `${dir}/`;
  return file.startsWith(dirSlash);
}
