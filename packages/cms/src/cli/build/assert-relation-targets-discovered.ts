import { QinoPrimitiveMarker, ROOT_FOLDER_NAME } from "../../data/globals";
import { getRelationTargets } from "../../lib/relations/get-relation-targets";
import type { AnyPrimitive } from "../../types/utils";
import { getPrimitiveId } from "./get-primitive-id";

/**
 * Fails when a relation targets a primitive the CLI didn't discover (not
 * exported from a file under `qino/`), which would leave a dangling id in
 * `config.json`.
 */
export function assertRelationTargetsDiscovered(
  primitives: Array<AnyPrimitive>,
) {
  const discovered = new Set(primitives.map(toKey));

  for (const primitive of primitives) {
    for (const { path, target } of getRelationTargets(
      primitive[QinoPrimitiveMarker].relations,
    )) {
      if (!discovered.has(toKey(target))) {
        throw new Error(
          `Relation "${path}" of "${getPrimitiveId(primitive)}" targets ${target[QinoPrimitiveMarker].is} "${getPrimitiveId(target)}", which isn't exported from a file under "${ROOT_FOLDER_NAME}/". Export it so it can be described in config.json.`,
        );
      }
    }
  }
}

function toKey(primitive: AnyPrimitive) {
  return `${primitive[QinoPrimitiveMarker].is}:${getPrimitiveId(primitive)}`;
}
