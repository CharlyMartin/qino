import { parsePath } from "@qino/tooling/relations";

import { META_FIELD_NAME, QinoPrimitiveMarker } from "../../data/globals";
import type { AnyRelations } from "../../types/relations";
import type { ResolveDepths } from "../../types/resolve";
import type { AnyEntry, AnyPrimitive, Slug } from "../../types/utils";
import {
  createDependencyCollector,
  type DependencyCollector,
} from "../cache/create-dependency-collector";
import type { ResolveCache } from "./create-resolve-cache";
import { fetchTargetEntry } from "./fetch-target-entry";
import { getRelationTargets } from "./get-relation-targets";
import { readTargetEntry } from "./read-target-entry";
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
  /** Records every target file, and each target's media, this entry uses. */
  dependencies?: DependencyCollector;
};

type TargetReferenceContext = Pick<
  ResolveEntryContext,
  "depth" | "override" | "dependencies"
>;

export type RelationErrorContext = {
  sourceFilePath: string;
  relationKey: string;
};

export function createRelationResolver(cache: ResolveCache) {
  return { resolveEntry };

  async function resolveEntry(entry: AnyEntry, ctx: ResolveEntryContext) {
    const {
      relations,
      depth,
      override,
      viewDepths,
      sourceInstanceId,
      dependencies,
    } = ctx;
    if (depth <= 0) return entry;

    let result: Record<string, unknown> = entry;

    for (const {
      path: relationKey,
      target: resolvedTarget,
      resolveDepth,
      parse,
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
          `Relation "${relationKey}" (from ${entry[META_FIELD_NAME].filePath}) points to a primitive created by a different initQino() call. All related primitives must come from the same qino instance.`,
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
            parse,
            targetMeta: resolvedTarget[QinoPrimitiveMarker],
            resolveTargetReference: (slug) => {
              return resolveTargetReference(
                resolvedTarget,
                slug,
                { depth: hops - 1, override: branchOverride, dependencies },
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
    { depth, override, dependencies }: TargetReferenceContext,
    sourceInstanceId: symbol,
    ctx: RelationErrorContext,
  ) {
    const raw = await getOrFetchRawTarget(target, slug, ctx, dependencies);

    // The target's own relations are followed per reference, to the depth
    // left on this branch, so their files are recorded on this entry too.
    return resolveEntry(raw, {
      relations: target[QinoPrimitiveMarker].relations,
      depth,
      override,
      sourceInstanceId,
      dependencies,
    });
  }

  async function getOrFetchRawTarget(
    target: AnyPrimitive,
    slug: Slug,
    ctx: RelationErrorContext,
    dependencies?: DependencyCollector,
  ) {
    const entryCache = getOrCreateEntryCache(cache, target);

    let read = entryCache.get(slug);

    if (!read) {
      const targetDependencies = dependencies && createDependencyCollector();
      read = {
        entry: readTargetEntry(target, slug, targetDependencies),
        dependencies: targetDependencies,
      };
      entryCache.set(slug, read);
    }

    // The read is shared, the error context isn't: each reference names its
    // own source in a failure.
    const entry = await fetchTargetEntry(target, slug, ctx, read.entry);
    if (dependencies) {
      // A read started without tracking can't prove what it used.
      if (read.dependencies) dependencies.merge(read.dependencies);
      else dependencies.markUnreusable();
    }
    return entry;
  }
}

function getOrCreateEntryCache(cache: ResolveCache, target: AnyPrimitive) {
  let entryCache = cache.get(target);

  if (!entryCache) {
    entryCache = new Map();
    cache.set(target, entryCache);
  }

  return entryCache;
}
