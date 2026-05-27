import type {
  AnyCollection,
  AnyEntry,
  AnySingleton,
  RelationTarget,
} from "../../types";
import { isSingleton } from "../../utils/is-singleton";
import { QinoMeta } from "../globals";
import type { ResolveCache } from "./create-resolve-cache";
import { parsePath } from "./parse-path";
import { resolveRelationLeaf } from "./resolve-relation-leaf";
import { walkAndSet } from "./walk-and-set";

type ResolveEntryContext = {
  relations: Record<string, RelationTarget | undefined>;
  depth: number;
};

type RelationErrorContext = {
  sourceFilePath: string;
  relationKey: string;
};

export function createRelationResolver(cache: ResolveCache) {
  return { resolveEntry };

  async function resolveEntry(entry: AnyEntry, ctx: ResolveEntryContext) {
    const { relations, depth } = ctx;
    if (depth <= 0) return entry;

    let result: Record<string, unknown> = entry;

    for (const [relationKey, target] of Object.entries(relations)) {
      if (!target) continue;

      const resolvedTarget = typeof target == "function" ? target() : target;
      const segments = parsePath(relationKey);

      const errorCtx: RelationErrorContext = {
        sourceFilePath: entry._meta.filePath,
        relationKey,
      };

      result = (await walkAndSet({
        value: result,
        segments,
        setLeaf: async (leaf) => {
          return resolveRelationLeaf(leaf, {
            ...errorCtx,
            target: resolvedTarget,
            resolveTargetReference: (slug) => {
              return resolveTargetReference(
                resolvedTarget,
                slug,
                depth - 1,
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
    target: AnyCollection | AnySingleton,
    slug: string,
    depth: number,
    ctx: RelationErrorContext,
  ) {
    const raw = await getOrFetchRawTarget(target, slug, ctx);

    return resolveEntry(raw, {
      relations: target[QinoMeta].relations,
      depth,
    });
  }

  async function getOrFetchRawTarget(
    target: AnyCollection | AnySingleton,
    slug: string,
    ctx: RelationErrorContext,
  ) {
    const cacheKey = getTargetUniquePath(target);
    const entryCache = getOrCreateEntryCache(cache, cacheKey);

    let entryPromise = entryCache.get(slug);

    if (!entryPromise) {
      entryPromise = fetchRawTarget(target, slug, ctx);

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

function getTargetUniquePath(target: AnyCollection | AnySingleton) {
  return isSingleton(target)
    ? target[QinoMeta].file
    : target[QinoMeta].directory;
}

async function fetchRawTarget(
  target: AnyCollection | AnySingleton,
  slug: string,
  ctx: RelationErrorContext,
) {
  try {
    return isSingleton(target)
      ? await target.getData({ resolveRelations: false })
      : await target.getOne(slug, { resolveRelations: false });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);

    const errorRef = isSingleton(target)
      ? target[QinoMeta].file
      : `${target[QinoMeta].directory}/${slug}`;

    throw new Error(
      `Failed to resolve relation "${ctx.relationKey}" → ${errorRef} (from ${ctx.sourceFilePath}): ${message}`,
      { cause: cause instanceof Error ? cause : undefined },
    );
  }
}
