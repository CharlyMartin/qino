import { collectJsonSchemaTypes } from "./collect-json-schema-types";

type JsonSchema = Record<string, unknown>;

const SCALAR_TYPES = new Set(["string", "number", "integer", "boolean"]);

/**
 * Whether JSON Schema nodes, every union branch included, only allow
 * strings, numbers, and booleans (and `null`), and at least one of them.
 */
export function allowsOnlyScalars(root: JsonSchema, nodes: Array<JsonSchema>) {
  return nodes.every((node) => {
    const types = [...collectJsonSchemaTypes(root, node)].filter(
      (type) => type != "null",
    );
    return types.length > 0 && types.every((type) => SCALAR_TYPES.has(type));
  });
}
