import { META_FIELD_NAME, QinoPrimitiveMarker } from "../../data/globals";
import type { AnyRelations } from "../../types/relations";
import type { ResolveDepths } from "../../types/resolve";
import type { AnyEntry, AnyPrimitive, Slug } from "../../types/utils";
import { isItem } from "../guards/is-item";
import type { ResolveCache } from "./create-resolve-cache";
import { fetchTargetEntry } from "./fetch-target-entry";
import { getRelationTargets } from "./get-relation-targets";
import { parsePath } from "./parse-path";
import { resolveRelationLeaf } from "./resolve-relation-leaf";
import { walkAndSet } from "./walk-and-set";

type ResolveEntryContext = {
  relations: AnyRelations;
  depth: number;
  /** When false, each relation resolves at most its own `resolveDepth`. */
  override: boolean;
  /** The view's depths by relation path, overriding the branch below each. */
  viewDepths?: ResolveDepths;
  sourceInstanceId: symbol;
};

export type RelationErrorContext = {
  sourceFilePath: string;
  relationKey: string;
};

export function createRelationResolver(cache: ResolveCache) {
  return { resolveEntry };

  async function resolveEntry(entry: AnyEntry, ctx: ResolveEntryContext) {
    const { relations, depth, override, viewDepths, sourceInstanceId } = ctx;
    if (depth <= 0) return entry;

    let result: Record<string, unknown> = entry;

    for (const {
      path: relationKey,
      target: resolvedTarget,
      resolveDepth,
    } of getRelationTargets(relations)) {
      const viewDepth =
        viewDepths && Object.hasOwn(viewDepths, relationKey)
          ? viewDepths[relationKey]
          : undefined;
      const branchOverride = override || viewDepth != undefined;
      const hops =
        viewDepth ?? (override ? depth : Math.min(depth, resolveDepth));
      if (hops <= 0) continue;

      if (resolvedTarget[QinoPrimitiveMarker].instanceId != sourceInstanceId) {
        throw new Error(
          `Relation "${relationKey}" (from ${entry[META_FIELD_NAME].filePath}) points to a primitive created by a different initQino() call. All related primitives must come from the same Qino instance.`,
        );
      }

      const segments = parsePath(relationKey);

      const errorCtx = {
        sourceFilePath: entry[META_FIELD_NAME].filePath,
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
                { depth: hops - 1, override: branchOverride },
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
    { depth, override }: Pick<ResolveEntryContext, "depth" | "override">,
    sourceInstanceId: symbol,
    ctx: RelationErrorContext,
  ) {
    const raw = await getOrFetchRawTarget(target, slug, ctx);

    return resolveEntry(raw, {
      relations: target[QinoPrimitiveMarker].relations,
      depth,
      override,
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
