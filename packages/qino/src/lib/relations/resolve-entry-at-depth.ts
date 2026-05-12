import type { AnyCollection, AnySingleton } from "../../types";
import { QinoMeta } from "../globals";
import type { ResolveCache } from "./create-resolve-cache";
import { fetchAndResolve } from "./fetch-and-resolve";
import { parsePath } from "./parse-path";
import { slugFromRelationValue } from "./slug-from-relation-value";
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

    result = (await walkAndSet(result, segments, async (leaf) => {
      if (typeof leaf != "string") {
        throw new Error(
          `Expected string at relation "${relationKey}" in ${sourceFilePath}; got ${typeof leaf}.`,
        );
      }
      if (leaf == "") {
        throw new Error(
          `Empty relation reference at "${relationKey}" in ${sourceFilePath}.`,
        );
      }
      const slug = slugFromRelationValue(leaf, resolvedTarget, {
        sourceFilePath,
        relationKey,
      });
      return fetchAndResolve(resolvedTarget, slug, depth - 1, cache, {
        sourceFilePath,
        relationKey,
      });
    })) as Record<string, unknown>;
  }

  return result;
}
