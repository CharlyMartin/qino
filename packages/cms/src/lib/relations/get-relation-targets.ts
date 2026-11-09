import { DEFAULT_RESOLVE_DEPTH } from "../../data/globals";
import type { AnyRelations } from "../../types/relations";

/**
 * Lists a primitive's declared relations with their targets resolved: skips
 * empty declarations, unwraps `{ target }` ones, and calls lazy
 * `() => target` ones.
 */
export function getRelationTargets(relations: AnyRelations) {
  return Object.entries(relations).flatMap(([path, decl]) => {
    if (!decl) return [];

    const { target, resolveDepth = DEFAULT_RESOLVE_DEPTH } =
      "target" in decl ? decl : { target: decl };

    return [
      {
        path,
        target: typeof target == "function" ? target() : target,
        resolveDepth,
      },
    ];
  });
}
