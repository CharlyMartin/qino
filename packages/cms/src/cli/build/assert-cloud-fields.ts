import { collectJsonSchemaTypes } from "./collect-json-schema-types";
import { findJsonSchemaNodes } from "./find-json-schema-nodes";
import { isRequiredJsonSchemaField } from "./is-required-json-schema-field";

type CloudFields = {
  searchableBy?: ReadonlyArray<string>;
  sortableBy?: ReadonlyArray<string>;
  hiddenFields?: ReadonlyArray<string>;
};

const SCALAR_TYPES = new Set(["string", "number", "integer", "boolean"]);

/**
 * `searchableBy`, `sortableBy`, and `hiddenFields` are typed against the
 * schema input, which opaque validators and JS users bypass. Fails when a
 * field isn't in the input JSON Schema, when a `sortableBy` field allows
 * anything but scalars (and `null`) there, in any union branch, or when a
 * `hiddenFields` field is required without a default by any variant.
 */
export function assertCloudFields(
  { searchableBy = [], sortableBy = [], hiddenFields = [] }: CloudFields,
  jsonSchema: Record<string, unknown>,
  primitiveId: string,
) {
  for (const [option, fields] of [
    ["searchableBy", searchableBy],
    ["sortableBy", sortableBy],
    ["hiddenFields", hiddenFields],
  ] as const) {
    for (const field of fields) {
      const nodes = findJsonSchemaNodes(jsonSchema, [
        { kind: "key", name: field },
      ]);

      if (nodes.length == 0) {
        throw new Error(
          `${option} "${field}" of "${primitiveId}" isn't a field of its schema input. Use the on-disk field name.`,
        );
      }

      if (
        option == "sortableBy" &&
        !nodes.every((node) =>
          isScalar(collectJsonSchemaTypes(jsonSchema, node)),
        )
      ) {
        throw new Error(
          `sortableBy "${field}" of "${primitiveId}" isn't a string, number, or boolean on disk.`,
        );
      }

      if (
        option == "hiddenFields" &&
        isRequiredJsonSchemaField(jsonSchema, field, "some")
      ) {
        throw new Error(
          `hiddenFields "${field}" of "${primitiveId}" is required without a default, so editors couldn't create entries. Make it optional or give it a default.`,
        );
      }
    }
  }
}

function isScalar(types: Set<string>) {
  const nonNull = [...types].filter((type) => type != "null");
  return nonNull.length > 0 && nonNull.every((type) => SCALAR_TYPES.has(type));
}
