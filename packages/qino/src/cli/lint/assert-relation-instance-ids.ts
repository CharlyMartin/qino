import { QinoPrimitiveMarker } from "../../data/globals";
import type { AnyPrimitive } from "../../types/utils";

export function assertRelationInstanceIds(
  primitives: Array<AnyPrimitive>,
  instanceId: symbol,
) {
  for (const primitive of primitives) {
    for (const [field, decl] of Object.entries(
      primitive[QinoPrimitiveMarker].relations,
    )) {
      if (!decl) continue;

      const target = typeof decl == "function" ? decl() : decl;

      if (target[QinoPrimitiveMarker].instanceId != instanceId) {
        throw new Error(
          `Relation "${field}" points to a primitive created by a different createQino() call. All related primitives must come from the same Qino instance.`,
        );
      }
    }
  }
}
