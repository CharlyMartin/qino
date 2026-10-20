import { assertTemplateFields } from "./assert-template-fields";

/**
 * An entry's `saveEntryAs` is type-checked from its literal, which widened strings,
 * opaque validators, and JS users bypass. Fails with a `/` or `.` (the cloud
 * UI adds the extension and, in trees, the parent folder), or when its tokens
 * don't pass `assertTemplateFields`.
 */
export function assertSaveEntryAs(
  saveEntryAs: string,
  jsonSchema: Record<string, unknown>,
  primitiveId: string,
) {
  const prefix = `saveEntryAs "${saveEntryAs}" of "${primitiveId}"`;

  if (/[/.]/.test(saveEntryAs)) {
    throw new Error(
      `${prefix} can't contain "/" or ".": the cloud UI adds the extension and, in trees, the parent folder.`,
    );
  }

  assertTemplateFields({
    prefix,
    template: saveEntryAs,
    result: "name",
    jsonSchema,
  });
}
