import type { RelationTarget } from "../../types";
import type { ResolveCache } from "./create-resolve-cache";
import { parsePath } from "./parse-path";
import { resolveRelationLeaf } from "./resolve-relation-leaf";
import { walkAndSet } from "./walk-and-set";

type Context = {
  relations: Record<string, RelationTarget | undefined>;
  depth: number;
  cache: ResolveCache;
};

export async function resolveEntry(
  entry: Record<string, unknown>,
  ctx: Context,
): Promise<Record<string, unknown>> {
  const { relations, depth, cache } = ctx;

  if (depth <= 0) return entry;

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
