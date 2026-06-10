import { ROOT_FOLDER_NAME } from "../../data";
import type { AnyPrimitive } from "../../types/utils";

export function assertPrimitivesExistence(primitives: Array<AnyPrimitive>) {
  // instead of erroring out, maybe here we should just print a warning that no primitives were found.
  // Tell the user to create a collection, singleton, or tree under the "qino/" folder.
  // Exit the process with code 0 instead of throwing an error.

  if (primitives.length == 0) {
    throw new Error(
      `No primitives found under "${ROOT_FOLDER_NAME}/". Define at least one collection, singleton, or tree.`,
    );
  }
}
