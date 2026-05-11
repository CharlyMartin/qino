import type { AnyCollection } from "../../types";
import { QinoMeta } from "../globals";
import type { ResolveCache } from "./create-resolve-cache";
import { resolveEntryAtDepth } from "./resolve-entry-at-depth";

export async function fetchAndResolve(
  targetCollection: AnyCollection,
  slug: string,
  depth: number,
  cache: ResolveCache,
  ctx: { sourceFilePath: string; relationKey: string },
): Promise<Record<string, unknown>> {
  const targetPath = targetCollection[QinoMeta].path;
  let perCollection = cache.get(targetPath);
  if (!perCollection) {
    perCollection = new Map();
    cache.set(targetPath, perCollection);
  }
  let rawPromise = perCollection.get(slug) as
    | Promise<Record<string, unknown>>
    | undefined;
  if (!rawPromise) {
    rawPromise = (async () => {
      try {
        const fetched = await targetCollection.getOne(slug, {
          resolveRelations: false,
        });
        return fetched as Record<string, unknown>;
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause);
        throw new Error(
          `Failed to resolve relation "${ctx.relationKey}" → ${targetPath}/${slug} (from ${ctx.sourceFilePath}): ${message}`,
          { cause: cause instanceof Error ? cause : undefined },
        );
      }
    })();
    perCollection.set(slug, rawPromise);
  }
  const raw = await rawPromise;
  return resolveEntryAtDepth(raw, targetCollection, depth, cache);
}
