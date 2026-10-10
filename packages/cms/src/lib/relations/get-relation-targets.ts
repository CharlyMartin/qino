import type { Relations } from "../../types/relations";
import type { ObjectSchema } from "../../types/schema";

/**
 * Lists a primitive's declared relations with their targets resolved: skips
 * empty declarations and calls lazy `() => target` ones.
 */
export function getRelationTargets(relations: Relations<ObjectSchema>) {
  return Object.entries(relations).flatMap(([path, decl]) =>
    decl ? [{ path, target: typeof decl == "function" ? decl() : decl }] : [],
  );
}
