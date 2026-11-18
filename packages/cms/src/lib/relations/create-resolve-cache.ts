import type { AnyEntry, AnyPrimitive, Slug } from "../../types/utils";
import type { DependencyCollector } from "../cache/create-dependency-collector";

export type TargetRead = {
  entry: Promise<AnyEntry>;
  /** The files this read used, merged into every entry that uses it. */
  dependencies?: DependencyCollector;
};

// Keyed by the target itself: two primitives over one directory can parse its
// files apart, so they mustn't share a read.
export type ResolveCache = Map<AnyPrimitive, Map<Slug, TargetRead>>;

export function createResolveCache(): ResolveCache {
  return new Map();
}
