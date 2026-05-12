import type { AnyCollection, AnySingleton } from "../../types";
import type { ResolveOption } from "../../types/resolve";
import type { ResolveCache } from "./create-resolve-cache";
import { normalizeDepth } from "./normalize-depth";
import { resolveEntryAtDepth } from "./resolve-entry-at-depth";

export async function resolveEntry(
  entry: Record<string, unknown>,
  host: AnyCollection | AnySingleton,
  resolveOption: ResolveOption,
  cache: ResolveCache,
): Promise<Record<string, unknown>> {
  const depth = normalizeDepth(resolveOption);
  return resolveEntryAtDepth(entry, host, depth, cache);
}
