import type { AnyPrimitive } from "../../types/utils";
import { compareCodeUnits } from "./compare-code-units";
import { getPrimitiveId } from "./get-primitive-id";
import { serializePrimitive } from "./serialize-primitive";

/**
 * Serializes primitives into an object keyed by id, sorted for stable diffs.
 */
export function serializePrimitives(primitives: Array<AnyPrimitive>) {
  return Object.fromEntries(
    primitives
      .map(
        (primitive) =>
          [getPrimitiveId(primitive), serializePrimitive(primitive)] as const,
      )
      .toSorted(([a], [b]) => compareCodeUnits(a, b)),
  );
}
