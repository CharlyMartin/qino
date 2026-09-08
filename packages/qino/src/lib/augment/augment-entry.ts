import type { AugmentOutput, Awaitable } from "../../types/augment";

export async function augmentEntry<
  Entry extends Record<string, unknown>,
  Output extends AugmentOutput,
>(
  entry: Entry & { _meta: { filePath: string } },
  augment?: (entry: Readonly<Entry>) => Awaitable<Output>,
) {
  if (!augment) return entry;

  let output: Output;

  try {
    output = await augment(entry);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`${entry._meta.filePath}: augment failed: ${message}`, {
      cause: cause instanceof Error ? cause : undefined,
    });
  }

  if (typeof output != "object" || output == null || Array.isArray(output)) {
    throw new Error(`${entry._meta.filePath}: augment must return an object.`);
  }

  const conflictingKeys = Object.keys(output).filter((key) =>
    Object.hasOwn(entry, key),
  );

  if (conflictingKeys.length > 0) {
    throw new Error(
      `${entry._meta.filePath}: augment cannot overwrite existing fields: ${conflictingKeys.join(", ")}.`,
    );
  }

  return { ...entry, ...output };
}
