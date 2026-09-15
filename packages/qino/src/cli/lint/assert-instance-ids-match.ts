import { QinoPrimitiveMarker } from "../../data/globals";
import type { AnyPrimitive } from "../../types/utils";

export function assertInstanceIdsMatch(
  primitives: Array<AnyPrimitive>,
  instanceId: symbol,
) {
  for (const primitive of primitives) {
    const primitiveInstanceId = primitive[QinoPrimitiveMarker].instanceId;

    if (primitiveInstanceId != instanceId) {
      throw new Error(
        `Primitive "${primitive[QinoPrimitiveMarker].is}" was created by a different Qino instance. ` +
          `Expected "${instanceId.description}" but got "${primitiveInstanceId.description}". ` +
          `Make sure all primitives are created with the same Qino config.`,
      );
    }
  }
}
