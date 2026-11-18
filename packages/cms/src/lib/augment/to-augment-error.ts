import { META_FIELD_NAME } from "../../data/globals";
import type { AugmentedSource } from "./merge-augment-output";

/** Wraps a failed `augment` with the entry's file path, keeping the cause. */
export function toAugmentError(entry: AugmentedSource, cause: unknown) {
  const message = cause instanceof Error ? cause.message : String(cause);

  return new Error(
    `${entry[META_FIELD_NAME].filePath}: augment failed: ${message}`,
    {
      cause: cause instanceof Error ? cause : undefined,
    },
  );
}
