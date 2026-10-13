import type { StandardJSONSchemaV1 } from "@standard-schema/spec";

import type { ObjectSchema } from "../../types/schema";

/**
 * Converts a primitive's schema to JSON Schema through the Standard JSON
 * Schema interface. Uses the `input` side, which describes the files on disk
 * (before any transform). Throws when the validator can't produce one: the
 * cloud UI contract must be complete.
 */
export function serializeJsonSchema(schema: ObjectSchema, primitiveId: string) {
  const { jsonSchema: converter } = schema[
    "~standard"
  ] as Partial<StandardJSONSchemaV1.Props>;

  if (!converter) {
    throw new Error(
      `Schema of "${primitiveId}" can't be converted to JSON Schema: its validator doesn't implement Standard JSON Schema (https://standardschema.dev/json-schema).`,
    );
  }

  try {
    return converter.input({ target: "draft-2020-12" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Schema of "${primitiveId}" can't be converted to JSON Schema: ${message}`,
    );
  }
}
