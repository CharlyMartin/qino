import { parsePath } from "../../lib/relations/parse-path";
import { collectJsonSchemaTypes } from "./collect-json-schema-types";
import { findJsonSchemaNodes } from "./find-json-schema-nodes";

type AssertMediaFieldsParams = {
  fields: ReadonlyArray<string>;
  relationPaths: ReadonlyArray<string>;
  jsonSchema: Record<string, unknown>;
  primitiveId: string;
};

/**
 * `media` paths are typed against the schema output, but `config.json`
 * describes files on disk. Fails when a path is malformed, isn't in the input
 * JSON Schema, allows anything but strings (and `null`) there in any union
 * branch, or is also a relation: a field holds either a media URL or a
 * reference.
 */
export function assertMediaFields({
  fields,
  relationPaths,
  jsonSchema,
  primitiveId,
}: AssertMediaFieldsParams) {
  for (const field of fields) {
    const prefix = `media "${field}" of "${primitiveId}"`;

    const nodes = findJsonSchemaNodes(jsonSchema, parseField(field, prefix));
    if (nodes.length == 0) {
      throw new Error(
        `${prefix} isn't a field of its schema input. Use the on-disk field name.`,
      );
    }

    const types = nodes
      .flatMap((node) => [...collectJsonSchemaTypes(jsonSchema, node)])
      .filter((type) => type != "null");
    if (types.length == 0 || types.some((type) => type != "string")) {
      throw new Error(`${prefix} isn't a string on disk.`);
    }

    if (relationPaths.includes(field)) {
      throw new Error(
        `${prefix} is also a relation. A field holds either a media URL or a reference.`,
      );
    }
  }
}

function parseField(field: string, prefix: string) {
  try {
    return parsePath(field);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`${prefix} isn't a valid path: ${message}`, { cause });
  }
}
