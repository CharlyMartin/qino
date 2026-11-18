import type { AnyEntry, AnyPrimitive, Slug } from "../../types/utils";

// Keyed by the target itself: two primitives over one directory can parse its
// files apart, so they mustn't share a read.
export type ResolveCache = Map<AnyPrimitive, Map<Slug, Promise<AnyEntry>>>;

export function createResolveCache(): ResolveCache {
  return new Map();
}
