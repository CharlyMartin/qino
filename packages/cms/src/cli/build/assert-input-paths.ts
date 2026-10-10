import type { AnyPrimitive } from "../../types/utils";
import { findJsonSchemaNode } from "./find-json-schema-node";
import { getMappedFields } from "./get-mapped-fields";

const HINT =
  "`config.json` describes files on disk, before schema transforms. Use the on-disk field name, or move the transform out of the schema.";

/**
 * Relation paths and `titleField` are typed against the schema's output, but
 * `config.json` describes its input. Fails when one of them doesn't exist in
 * the input JSON Schema, e.g. renamed by a transform, instead of emitting
 * fields the cloud UI can't find on disk.
 */
export function assertInputPaths(
  primitive: AnyPrimitive,
  jsonSchema: Record<string, unknown>,
  primitiveId: string,
) {
  for (const { label, segments } of getMappedFields(primitive)) {
    if (!findJsonSchemaNode(jsonSchema, segments)) {
      throw new Error(
        `${label} of "${primitiveId}" isn't a field of its schema input. ${HINT}`,
      );
    }
  }
}
