import { MAX_RESOLVE_DEPTH } from "../../data/globals";
import type { AnyRelations } from "../../types/relations";

/**
 * Checks a view's `resolveDepth`: an object keyed by the primitive's relation
 * paths, each holding a whole number of hops from 0 to `MAX_RESOLVE_DEPTH`.
 */
export function assertViewResolveDepth(
  name: string,
  resolveDepth: unknown,
  relations: AnyRelations,
) {
  if (
    !resolveDepth ||
    typeof resolveDepth != "object" ||
    Array.isArray(resolveDepth)
  ) {
    throw new Error(
      `View "${name}": resolveDepth must be an object of depths by relation path, such as { author: 2 }.`,
    );
  }

  for (const [path, depth] of Object.entries(resolveDepth)) {
    if (!Object.hasOwn(relations, path) || !relations[path]) {
      const declared = Object.keys(relations).filter((key) => relations[key]);
      throw new Error(
        `View "${name}": resolveDepth sets "${path}", which isn't a relation. Relations: ${declared.join(", ") || "(none)"}.`,
      );
    }

    if (
      typeof depth != "undefined" &&
      (!Number.isInteger(depth) || depth < 0 || depth > MAX_RESOLVE_DEPTH)
    ) {
      throw new Error(
        `View "${name}": resolveDepth of "${path}" must be a whole number from 0 to ${MAX_RESOLVE_DEPTH}, got ${JSON.stringify(depth)}.`,
      );
    }
  }
}
