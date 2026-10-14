import { collectJsonSchemaTypes } from "./collect-json-schema-types";
import { findJsonSchemaNode } from "./find-json-schema-node";

type CloudFields = {
  searchableBy?: ReadonlyArray<string>;
  sortableBy?: ReadonlyArray<string>;
};

const SCALAR_TYPES = new Set(["string", "number", "integer", "boolean"]);

/**
 * `searchableBy` and `sortableBy` are typed against the schema's output, but
 * the cloud UI reads files on disk. Fails when a field isn't in the input
 * JSON Schema, or when a `sortableBy` field allows anything but scalars (and
 * `null`) there, in any union branch.
 */
export function assertCloudFields(
  { searchableBy = [], sortableBy = [] }: CloudFields,
  jsonSchema: Record<string, unknown>,
  primitiveId: string,
) {
  for (const [option, fields] of [
    ["searchableBy", searchableBy],
    ["sortableBy", sortableBy],
  ] as const) {
    for (const field of fields) {
      const node = findJsonSchemaNode(jsonSchema, [
        { kind: "key", name: field },
      ]);

      if (!node) {
        throw new Error(
          `${option} "${field}" of "${primitiveId}" isn't a field of its schema input. Use the on-disk field name.`,
        );
      }

      if (
        option == "sortableBy" &&
        !isScalar(collectJsonSchemaTypes(jsonSchema, node))
      ) {
        throw new Error(
          `sortableBy "${field}" of "${primitiveId}" isn't a string, number, or boolean on disk.`,
        );
      }
    }
  }
}

function isScalar(types: Set<string>) {
  const nonNull = [...types].filter((type) => type != "null");
  return nonNull.length > 0 && nonNull.every((type) => SCALAR_TYPES.has(type));
}
