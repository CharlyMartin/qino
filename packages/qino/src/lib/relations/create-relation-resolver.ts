import { QinoPrimitiveMarker } from "../../data/globals";
import type { RelationTarget } from "../../types/relations";
import type { AnyEntry, AnyPrimitive, Slug } from "../../types/utils";
import { isItem } from "../../utils/is-item";
import type { ResolveCache } from "./create-resolve-cache";
import { fetchTargetEntry } from "./fetch-target-entry";
import { parsePath } from "./parse-path";
import { resolveRelationLeaf } from "./resolve-relation-leaf";
import { walkAndSet } from "./walk-and-set";

type ResolveEntryContext = {
  relations: Record<string, RelationTarget | undefined>;
  depth: number;
  sourceInstanceId: symbol;
};

export type RelationErrorContext = {
  sourceFilePath: string;
  relationKey: string;
};

export function createRelationResolver(cache: ResolveCache) {
  return { resolveEntry };

  async function resolveEntry(entry: AnyEntry, ctx: ResolveEntryContext) {
    const { relations, depth, sourceInstanceId } = ctx;
    if (depth <= 0) return entry;

    let result: Record<string, unknown> = entry;

    for (const [relationKey, target] of Object.entries(relations)) {
      if (!target) continue;

      const resolvedTarget = typeof target == "function" ? target() : target;

      if (resolvedTarget[QinoPrimitiveMarker].instanceId != sourceInstanceId) {
        throw new Error(
          `Relation "${relationKey}" (from ${entry._meta.filePath}) points to a primitive created by a different createQino() call. All related primitives must come from the same Qino instance.`,
        );
      }

      const segments = parsePath(relationKey);

      const errorCtx = {
        sourceFilePath: entry._meta.filePath,
        relationKey,
      } satisfies RelationErrorContext;

      result = (await walkAndSet({
        value: result,
        segments,
        setLeaf: async (leaf) => {
          return resolveRelationLeaf(leaf, {
            ...errorCtx,
            targetMeta: resolvedTarget[QinoPrimitiveMarker],
            resolveTargetReference: (slug) => {
              return resolveTargetReference(
                resolvedTarget,
                slug,
                depth - 1,
                sourceInstanceId,
                errorCtx,
              );
            },
          });
        },
      })) as Record<string, unknown>;
    }

    return result;
  }

  async function resolveTargetReference(
    target: AnyPrimitive,
    slug: Slug,
    depth: number,
    sourceInstanceId: symbol,
    ctx: RelationErrorContext,
  ) {
    const raw = await getOrFetchRawTarget(target, slug, ctx);

    return resolveEntry(raw, {
      relations: target[QinoPrimitiveMarker].relations,
      depth,
      sourceInstanceId,
    });
  }

  async function getOrFetchRawTarget(
    target: AnyPrimitive,
    slug: Slug,
    ctx: RelationErrorContext,
  ) {
    const cacheKey = getTargetUniquePath(target);
    const entryCache = getOrCreateEntryCache(cache, cacheKey);

    let entryPromise = entryCache.get(slug);

    if (!entryPromise) {
      entryPromise = fetchTargetEntry(target, slug, ctx);
      entryCache.set(slug, entryPromise);
    }

    return entryPromise;
  }
}

function getOrCreateEntryCache(cache: ResolveCache, cacheKey: string) {
  let entryCache = cache.get(cacheKey);

  if (!entryCache) {
    entryCache = new Map();
    cache.set(cacheKey, entryCache);
  }

  return entryCache;
}

function getTargetUniquePath(target: AnyPrimitive) {
  return isItem(target)
    ? target[QinoPrimitiveMarker].file
    : target[QinoPrimitiveMarker].directory;
}
