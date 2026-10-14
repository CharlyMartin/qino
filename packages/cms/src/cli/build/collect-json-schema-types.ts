import { resolveJsonSchemaRef } from "./resolve-json-schema-ref";

type JsonSchema = Record<string, unknown>;

const COMBINATORS = ["anyOf", "oneOf", "allOf"] as const;

/**
 * Lists every type a JSON Schema node allows, across all `anyOf` / `oneOf` /
 * `allOf` branches and local `$ref`s. Without `type`, falls back to the types
 * of `const` / `enum` values. A node with no type information gives
 * `"unknown"`.
 */
export function collectJsonSchemaTypes(root: JsonSchema, node: unknown) {
  const types = new Set<string>();
  collect(node, new Set());
  return types;

  function collect(current: unknown, seen: Set<unknown>) {
    if (typeof current != "object" || current == null || seen.has(current)) {
      return;
    }

    const schema = current as JsonSchema;
    const nextSeen = new Set(seen).add(current);

    if (typeof schema.$ref == "string") {
      collect(resolveJsonSchemaRef(root, schema.$ref), nextSeen);
      return;
    }

    const branches = COMBINATORS.flatMap((combinator) => {
      const value = schema[combinator];
      return Array.isArray(value) ? value : [];
    });

    for (const branch of branches) collect(branch, nextSeen);

    if (typeof schema.type == "string") {
      types.add(schema.type);
    } else if (Array.isArray(schema.type)) {
      for (const type of schema.type) types.add(String(type));
    } else if ("const" in schema || Array.isArray(schema.enum)) {
      const values = "const" in schema ? [schema.const] : schema.enum;
      for (const value of values as Array<unknown>) {
        types.add(value === null ? "null" : typeof value);
      }
    } else if (branches.length == 0) {
      types.add("unknown");
    }
  }
}
