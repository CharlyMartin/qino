import { MARKDOWN_FIELD_NAME, META_FIELD_NAME } from "../../data/globals";
import type { AugmentOutput, Awaitable } from "../../types/augment";

export async function augmentEntry<
  Entry extends Record<string, unknown>,
  Output extends AugmentOutput,
>(
  entry: Entry & { [META_FIELD_NAME]: { filePath: string } },
  augment?: (entry: Readonly<Entry>) => Awaitable<Output>,
) {
  if (!augment) return entry;

  let output: Output;

  try {
    output = await augment(entry);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);

    throw new Error(
      `${entry[META_FIELD_NAME].filePath}: augment failed: ${message}`,
      {
        cause: cause instanceof Error ? cause : undefined,
      },
    );
  }

  if (typeof output != "object" || output == null || Array.isArray(output)) {
    throw new Error(
      `${entry[META_FIELD_NAME].filePath}: augment must return an object.`,
    );
  }

  const conflictingKeys = Object.keys(output).filter(
    (key) =>
      Object.hasOwn(entry, key) ||
      isReservedMarkdownField(key, entry[META_FIELD_NAME].filePath),
  );

  if (conflictingKeys.length > 0) {
    throw new Error(
      `${entry[META_FIELD_NAME].filePath}: augment cannot add reserved or overwrite existing fields: ${conflictingKeys.join(", ")}.`,
    );
  }

  return { ...entry, ...output };
}

function isReservedMarkdownField(key: string, filePath: string) {
  return key == MARKDOWN_FIELD_NAME && !filePath.endsWith(".json");
}
