import type { AnyEntry } from "../../types/utils";

export type ResolveCache = Map<string, Map<string, Promise<AnyEntry>>>;

export function createResolveCache(): ResolveCache {
  return new Map();
}
