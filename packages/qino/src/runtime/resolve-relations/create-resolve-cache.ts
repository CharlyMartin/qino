export type ResolveCache = Map<string, Map<string, Promise<unknown>>>;

export function createResolveCache() {
  return new Map() as ResolveCache;
}
