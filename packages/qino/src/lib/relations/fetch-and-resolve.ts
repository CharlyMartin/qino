import { QinoMeta } from "../globals";
import type { AnyCollection, AnySingleton } from "../../types";

import type { ResolveCache } from "./create-resolve-cache";
import { resolveEntryAtDepth } from "./resolve-entry-at-depth";

export async function fetchAndResolve(
  target: AnyCollection | AnySingleton,
  slug: string,
  depth: number,
  cache: ResolveCache,
  ctx: { sourceFilePath: string; relationKey: string },
): Promise<Record<string, unknown>> {
  const meta = target[QinoMeta];
  const cacheKey = "file" in meta ? meta.file : meta.directory;
  let perTarget = cache.get(cacheKey);
  if (!perTarget) {
    perTarget = new Map();
    cache.set(cacheKey, perTarget);
  }
  let rawPromise = perTarget.get(slug) as
    | Promise<Record<string, unknown>>
    | undefined;
  if (!rawPromise) {
    rawPromise = (async () => {
      try {
        const fetched =
          "file" in meta
            ? await (target as AnySingleton).getData({
                resolveRelations: false,
              })
            : await (target as AnyCollection).getOne(slug, {
                resolveRelations: false,
              });
        return fetched as Record<string, unknown>;
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause);
        const ref = "file" in meta ? meta.file : `${meta.directory}/${slug}`;
        throw new Error(
          `Failed to resolve relation "${ctx.relationKey}" → ${ref} (from ${ctx.sourceFilePath}): ${message}`,
          { cause: cause instanceof Error ? cause : undefined },
        );
      }
    })();
    perTarget.set(slug, rawPromise);
  }
  const raw = await rawPromise;
  return resolveEntryAtDepth(raw, target, depth, cache);
}
