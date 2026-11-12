import { JSON_PATH_ARRAY, QinoPrimitiveMarker } from "../../data/globals";
import { getRelationTargets } from "../../lib/relations/get-relation-targets";
import type { Relations } from "../../types/relations";
import type { ObjectSchema } from "../../types/schema";
import { compareCodeUnits } from "./compare-code-units";
import { getPrimitiveId } from "./get-primitive-id";

/**
 * Turns a primitive's relations map into a sorted, JSON-friendly array,
 * referencing each target by kind and id. A `parse` callback can't be
 * serialized, so a relation with one gets `customFormat: true`.
 */
export function serializeRelations(relations: Relations<ObjectSchema>) {
  return getRelationTargets(relations)
    .map(({ path, target, parse }) => ({
      path,
      target: {
        kind: target[QinoPrimitiveMarker].is,
        id: getPrimitiveId(target),
      },
      cardinality: path.includes(JSON_PATH_ARRAY) ? "many" : "one",
      ...(parse ? { customFormat: true } : {}),
    }))
    .toSorted((a, b) => compareCodeUnits(a.path, b.path));
}
