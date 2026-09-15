import { QinoPrimitives } from "../../data/globals";
import type { GenericPath } from "../../types/utils";

type PrimitiveKind = (typeof QinoPrimitives)[keyof typeof QinoPrimitives];

export type PrimitivePath = {
  kind: PrimitiveKind;
  path: GenericPath;
};

// Returns a human-readable message when the two primitives own conflicting
// paths, or null when they are disjoint. Used by the CLI lint's all-pairs pass.
export function describePathConflict(a: PrimitivePath, b: PrimitivePath) {
  if (a.kind == b.kind) {
    if (a.kind == QinoPrimitives.collection) {
      return pathsOverlap(a.path, b.path)
        ? `Collection directories overlap: "${a.path}" and "${b.path}". Each collection must own a distinct, non-overlapping directory.`
        : null;
    }

    if (a.kind == QinoPrimitives.tree) {
      return pathsOverlap(a.path, b.path)
        ? `Tree directories overlap: "${a.path}" and "${b.path}". Each tree must own a distinct, non-overlapping directory.`
        : null;
    }

    return samePath(a.path, b.path)
      ? `Two items target the same file: "${a.path}". Each item must own a distinct file.`
      : null;
  }

  const treeDir = pickPath(a, b, QinoPrimitives.tree);
  const collectionDir = pickPath(a, b, QinoPrimitives.collection);
  const itemFile = pickPath(a, b, QinoPrimitives.item);

  if (treeDir && collectionDir) {
    return pathsOverlap(treeDir, collectionDir)
      ? `Tree directory "${treeDir}" overlaps with collection directory "${collectionDir}". Trees and collections must own distinct directories.`
      : null;
  }

  if (itemFile && treeDir) {
    return isFileInsideDir(itemFile, treeDir)
      ? `Item file "${itemFile}" sits inside tree directory "${treeDir}". A tree owns its directory exclusively.`
      : null;
  }

  if (itemFile && collectionDir) {
    return isFileInsideDir(itemFile, collectionDir)
      ? `Item file "${itemFile}" sits inside collection directory "${collectionDir}". A collection owns its directory exclusively.`
      : null;
  }

  return null;
}

function pickPath(a: PrimitivePath, b: PrimitivePath, kind: PrimitiveKind) {
  if (a.kind == kind) return a.path;
  if (b.kind == kind) return b.path;
  return undefined;
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
