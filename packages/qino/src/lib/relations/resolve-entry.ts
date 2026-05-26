import type { AnyEntry, RelationTarget } from "../../types";
import type { ResolveCache } from "./create-resolve-cache";
import { parsePath } from "./parse-path";
import { resolveRelationLeaf } from "./resolve-relation-leaf";
import { walkAndSet } from "./walk-and-set";

type Context = {
  relations: Record<string, RelationTarget | undefined>;
  depth: number;
  cache: ResolveCache;
};

export async function resolveEntry(entry: AnyEntry, ctx: Context) {
  const { relations, depth, cache } = ctx;
  if (depth <= 0) return entry;

  const sourceFilePath = entry._meta.filePath;

  let result: Record<string, unknown> = entry;

  for (const [relationKey, target] of Object.entries(relations)) {
    if (!target) continue;

    const resolvedTarget = typeof target == "function" ? target() : target;

    const segments = parsePath(relationKey);

    result = (await walkAndSet({
      value: result,
      segments,
      setLeaf: async (leaf) => {
        return resolveRelationLeaf(leaf, {
          relationKey,
          sourceFilePath,
          target: resolvedTarget,
          depth: depth - 1,
          cache,
        });
      },
    })) as Record<string, unknown>;
  }

  return result;
}
