import type { AnyCollection, AnySingleton } from "../../types";
import { QinoMeta } from "../globals";
import type { ResolveCache } from "./create-resolve-cache";
import { parsePath } from "./parse-path";
import { resolveRelationLeaf } from "./resolve-relation-leaf";
import { walkAndSet } from "./walk-and-set";

export async function resolveEntryAtDepth(
  entry: Record<string, unknown>,
  host: AnyCollection | AnySingleton,
  depth: number,
  cache: ResolveCache,
): Promise<Record<string, unknown>> {
  if (depth <= 0) return entry;

  const relations = host[QinoMeta].relations;
  let result: Record<string, unknown> = entry;

  for (const [relationKey, target] of Object.entries(relations)) {
    if (!target) continue;
    const resolvedTarget = typeof target == "function" ? target() : target;
    const segments = parsePath(relationKey);
    const sourceFilePath =
      (entry._meta as { filePath?: string } | undefined)?.filePath ??
      "<unknown>";

    result = (await walkAndSet(result, segments, async (leaf) =>
      resolveRelationLeaf(leaf, {
        relationKey,
        sourceFilePath,
        target: resolvedTarget,
        depth: depth - 1,
        cache,
      }),
    )) as Record<string, unknown>;
  }

  return result;
}
