import { JSON_PATH_ARRAY, QinoPrimitiveMarker } from "../../data/globals";
import { getRelationTargets } from "../../lib/relations/get-relation-targets";
import type { Relations } from "../../types/relations";
import type { ObjectSchema } from "../../types/schema";
import { compareCodeUnits } from "./compare-code-units";
import { getPrimitiveId } from "./get-primitive-id";

/**
 * Turns a primitive's relations map into a sorted, JSON-friendly array,
 * referencing each target by kind and id.
 */
export function serializeRelations(relations: Relations<ObjectSchema>) {
  return getRelationTargets(relations)
    .map(({ path, target }) => ({
      path,
      target: {
        kind: target[QinoPrimitiveMarker].is,
        id: getPrimitiveId(target),
      },
      cardinality: path.includes(JSON_PATH_ARRAY) ? "many" : "one",
    }))
    .toSorted((a, b) => compareCodeUnits(a.path, b.path));
}
