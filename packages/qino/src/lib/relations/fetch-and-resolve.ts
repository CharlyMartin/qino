import type { AnyCollection, AnyEntry, AnySingleton } from "../../types";
import { QinoMeta } from "../globals";
import type { ResolveCache } from "./create-resolve-cache";
import { resolveEntry } from "./resolve-entry";

type CTX = {
  sourceFilePath: string;
  relationKey: string;
};

export async function fetchAndResolve(
  target: AnyCollection | AnySingleton,
  slug: string,
  depth: number,
  cache: ResolveCache,
  ctx: CTX,
): Promise<Record<string, unknown>> {
  const meta = target[QinoMeta];
  const cacheKey = meta.is == "singleton" ? meta.file : meta.directory;
  let perTarget = cache.get(cacheKey);
  if (!perTarget) {
    perTarget = new Map();
    cache.set(cacheKey, perTarget);
  }
  let rawPromise = perTarget.get(slug) as Promise<AnyEntry> | undefined;
  if (!rawPromise) {
    rawPromise = (async () => {
      try {
        const fetched =
          meta.is == "singleton"
            ? await (target as AnySingleton).getData({
                resolveRelations: false,
              })
            : await (target as AnyCollection).getOne(slug, {
                resolveRelations: false,
              });
        return fetched;
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause);
        const ref =
          meta.is == "singleton" ? meta.file : `${meta.directory}/${slug}`;
        throw new Error(
          `Failed to resolve relation "${ctx.relationKey}" → ${ref} (from ${ctx.sourceFilePath}): ${message}`,
          { cause: cause instanceof Error ? cause : undefined },
        );
      }
    })();
    perTarget.set(slug, rawPromise);
  }
  const raw = await rawPromise;
  return resolveEntry(raw, {
    relations: target[QinoMeta].relations,
    depth,
    cache,
  });
}
