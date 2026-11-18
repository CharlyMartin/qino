import { META_FIELD_NAME } from "../../data/globals";

export type AugmentedSource = { [META_FIELD_NAME]: { filePath: string } };

/**
 * Adds `augment`'s output to its entry. Fails when the output isn't an object,
 * or when it would overwrite one of the entry's fields.
 */
export function mergeAugmentOutput<Entry extends AugmentedSource, Output>(
  entry: Entry,
  output: Output,
) {
  if (typeof output != "object" || output == null || Array.isArray(output)) {
    throw new Error(
      `${entry[META_FIELD_NAME].filePath}: augment must return an object.`,
    );
  }

  const conflictingKeys = Object.keys(output).filter((key) =>
    Object.hasOwn(entry, key),
  );

  if (conflictingKeys.length > 0) {
    throw new Error(
      `${entry[META_FIELD_NAME].filePath}: augment cannot add reserved or overwrite existing fields: ${conflictingKeys.join(", ")}.`,
    );
  }

  return { ...entry, ...output };
}
