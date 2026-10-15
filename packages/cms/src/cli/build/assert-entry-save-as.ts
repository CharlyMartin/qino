import { allowsOnlyScalars } from "./allows-only-scalars";
import { findJsonSchemaNodes } from "./find-json-schema-nodes";
import { getPathTokens } from "./get-path-tokens";
import { isRequiredJsonSchemaField } from "./is-required-json-schema-field";

/**
 * An entry's `saveAs` is type-checked from its literal, which widened strings,
 * opaque validators, and JS users bypass. Fails without a token, with a `/`
 * or `.` (the cloud UI adds the extension and, in trees, the parent folder),
 * or when a token isn't a top-level field that every variant of the input
 * JSON Schema requires and allows only scalars for.
 */
export function assertEntrySaveAs(
  saveAs: string,
  jsonSchema: Record<string, unknown>,
  primitiveId: string,
) {
  const prefix = `saveAs "${saveAs}" of "${primitiveId}"`;
  const tokens = getPathTokens(saveAs);

  if (tokens.length == 0) {
    throw new Error(`${prefix} needs at least one {field}.`);
  }

  if (/[/.]/.test(saveAs)) {
    throw new Error(
      `${prefix} can't contain "/" or ".": the cloud UI adds the extension and, in trees, the parent folder.`,
    );
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
        `${prefix} uses "{${token}}", which is optional, so entries could get an empty name. Use a required field.`,
      );
    }
  }
}
