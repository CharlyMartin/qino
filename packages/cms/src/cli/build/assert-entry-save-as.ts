import { assertTemplateFields } from "./assert-template-fields";

/**
 * An entry's `saveAs` is type-checked from its literal, which widened strings,
 * opaque validators, and JS users bypass. Fails with a `/` or `.` (the cloud
 * UI adds the extension and, in trees, the parent folder), or when its tokens
 * don't pass `assertTemplateFields`.
 */
export function assertEntrySaveAs(
  saveAs: string,
  jsonSchema: Record<string, unknown>,
  primitiveId: string,
) {
  const prefix = `saveAs "${saveAs}" of "${primitiveId}"`;

  if (/[/.]/.test(saveAs)) {
    throw new Error(
      `${prefix} can't contain "/" or ".": the cloud UI adds the extension and, in trees, the parent folder.`,
    );
  }

  assertTemplateFields({
    prefix,
    template: saveAs,
    result: "name",
    jsonSchema,
  });
}
