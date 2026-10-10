import { QinoPrimitiveMarker } from "../../data/globals";
import { getRelationTargets } from "../../lib/relations/get-relation-targets";
import type { AnyPrimitive } from "../../types/utils";

export function assertRelationInstanceIds(
  primitives: Array<AnyPrimitive>,
  instanceId: symbol,
) {
  for (const primitive of primitives) {
    for (const { path, target } of getRelationTargets(
      primitive[QinoPrimitiveMarker].relations,
    )) {
      if (target[QinoPrimitiveMarker].instanceId != instanceId) {
        throw new Error(
          `Relation "${path}" points to a primitive created by a different initQino() call. All related primitives must come from the same Qino instance.`,
        );
      }
    }
  }
}
