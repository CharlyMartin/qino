import { ROOT_FOLDER_NAME } from "../../data/globals";
import type { AnyPrimitive } from "../../types/utils";

export function assertPrimitivesExistence(primitives: Array<AnyPrimitive>) {
  if (primitives.length == 0) {
    throw new Error(
      `No primitives found under "${ROOT_FOLDER_NAME}/". Define at least one collection, item, or tree.`,
    );
  }
}
