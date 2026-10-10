import type { Segment } from "../../lib/relations/parse-path";
import { resolveJsonSchemaRef } from "./resolve-json-schema-ref";

type JsonSchema = Record<string, unknown>;

const COMBINATORS = ["anyOf", "oneOf", "allOf"] as const;

/**
 * Walks a JSON Schema along relation path segments: keys follow `properties`,
 * `[*]` follows `items`. Branches of `anyOf` / `oneOf` / `allOf` (optional,
 * nullable, unions) and local `$ref`s are searched. Returns the node, or
 * `undefined` when the path doesn't exist in the schema.
 */
export function findJsonSchemaNode(
  root: JsonSchema,
  segments: Array<Segment>,
): JsonSchema | undefined {
  return walk(root, 0, new Set());

  function walk(
    node: unknown,
    index: number,
    seen: Set<unknown>,
  ): JsonSchema | undefined {
    if (typeof node != "object" || node == null || seen.has(node)) {
      return undefined;
    }

    const schema = node as JsonSchema;
    if (typeof schema.$ref == "string") {
      return walk(
        resolveJsonSchemaRef(root, schema.$ref),
        index,
        new Set(seen).add(node),
      );
    }

    for (const combinator of COMBINATORS) {
      const branches = schema[combinator];
      if (!Array.isArray(branches)) continue;

      for (const branch of branches) {
        const found = walk(branch, index, seen);
        if (found) return found;
      }
    }

    const segment = segments[index];
    if (!segment) return schema;

    if (segment.kind == "array") {
      return walk(schema.items, index + 1, new Set());
    }

    const properties = schema.properties as Record<string, unknown> | undefined;
    return properties && Object.hasOwn(properties, segment.name)
      ? walk(properties[segment.name], index + 1, new Set())
      : undefined;
  }
}
