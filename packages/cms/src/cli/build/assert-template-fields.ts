import { allowsOnlyScalars } from "./allows-only-scalars";
import { findJsonSchemaNodes } from "./find-json-schema-nodes";
import { getTemplateTokens } from "./get-template-tokens";
import { isRequiredJsonSchemaField } from "./is-required-json-schema-field";

type TemplateFieldsOptions = {
  /** Error prefix, e.g. `saveEntryAs "{title}" of "posts"`. */
  prefix: string;
  template: string;
  /** What an optional token could leave empty, e.g. `"name"`. */
  result: string;
  jsonSchema: Record<string, unknown>;
};

/**
 * Checks the `{field}` tokens of an entry template (`saveEntryAs`, `displayEntryAs`):
 * at least one, each a top-level field that every variant of the input JSON
 * Schema requires and allows only scalars for.
 */
export function assertTemplateFields({
  prefix,
  template,
  result,
  jsonSchema,
}: TemplateFieldsOptions) {
  const tokens = getTemplateTokens(template);

  if (tokens.length == 0) {
    throw new Error(`${prefix} needs at least one {field}.`);
  }

  for (const token of tokens) {
    const nodes = findJsonSchemaNodes(jsonSchema, [
      { kind: "key", name: token },
    ]);

    if (nodes.length == 0) {
      throw new Error(
        `${prefix} has an unknown field "{${token}}". Use a top-level field of its schema input.`,
      );
    }

    if (!allowsOnlyScalars(jsonSchema, nodes)) {
      throw new Error(
        `${prefix} uses "{${token}}", which isn't a string, number, or boolean on disk.`,
      );
    }

    if (!isRequiredJsonSchemaField(jsonSchema, token, "every")) {
      throw new Error(
        `${prefix} uses "{${token}}", which is optional, so entries could get an empty ${result}. Use a required field.`,
      );
    }
  }
}
