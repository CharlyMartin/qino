import type { Awaitable, TransformOutput } from "../../types/transform";

export async function transformEntry<
  Entry extends Record<string, unknown>,
  Output extends TransformOutput,
>(
  entry: Entry & { _meta: { filePath: string } },
  transform?: (entry: Readonly<Entry>) => Awaitable<Output>,
) {
  if (!transform) return entry;

  let output: Output;

  try {
    output = await transform(entry);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`${entry._meta.filePath}: transform failed: ${message}`, {
      cause: cause instanceof Error ? cause : undefined,
    });
  }

  if (typeof output != "object" || output == null || Array.isArray(output)) {
    throw new Error(
      `${entry._meta.filePath}: transform must return an object.`,
    );
  }

  const conflictingKeys = Object.keys(output).filter((key) =>
    Object.hasOwn(entry, key),
  );

  if (conflictingKeys.length > 0) {
    throw new Error(
      `${entry._meta.filePath}: transform cannot overwrite existing fields: ${conflictingKeys.join(", ")}.`,
    );
  }

  return { ...entry, ...output };
}
