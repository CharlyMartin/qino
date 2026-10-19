import { assertTemplateFields } from "./assert-template-fields";

/**
 * `displayEntryAs` is type-checked from its literal, which widened strings,
 * opaque validators, and JS users bypass. Fails when its tokens don't pass
 * `assertTemplateFields`.
 */
export function assertDisplayEntryAs(
  displayEntryAs: string,
  jsonSchema: Record<string, unknown>,
  primitiveId: string,
) {
  assertTemplateFields({
    prefix: `displayEntryAs "${displayEntryAs}" of "${primitiveId}"`,
    template: displayEntryAs,
    result: "label",
    jsonSchema,
  });
}
