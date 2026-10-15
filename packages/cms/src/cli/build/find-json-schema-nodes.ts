import type { Segment } from "../../lib/relations/parse-path";
import { resolveJsonSchemaRef } from "./resolve-json-schema-ref";

type JsonSchema = Record<string, unknown>;

const COMBINATORS = ["anyOf", "oneOf", "allOf"] as const;

/**
 * Walks a JSON Schema along relation path segments: keys follow `properties`,
 * `[*]` follows `items`. Every branch of `anyOf` / `oneOf` / `allOf`
 * (optional, nullable, unions) and local `$ref`s are followed along the way.
 * Returns each node at the end of the path, one per branch the path exists
 * in, the first branch first. The last node keeps its own unions. Empty when
 * the path doesn't exist in the schema.
 */
export function findJsonSchemaNodes(
  root: JsonSchema,
  segments: Array<Segment>,
) {
  const nodes: Array<JsonSchema> = [];
  walk(root, 0, new Set());
  return nodes;

  function walk(node: unknown, index: number, seen: Set<unknown>) {
    if (typeof node != "object" || node == null || seen.has(node)) return;

    const schema = node as JsonSchema;
    if (typeof schema.$ref == "string") {
      walk(
        resolveJsonSchemaRef(root, schema.$ref),
        index,
        new Set(seen).add(node),
      );
      return;
    }

    const segment = segments[index];
    if (!segment) {
      nodes.push(schema);
      return;
    }

    for (const combinator of COMBINATORS) {
      const branches = schema[combinator];
      if (!Array.isArray(branches)) continue;

      for (const branch of branches) walk(branch, index, seen);
    }

    if (segment.kind == "array") {
      walk(schema.items, index + 1, new Set());
      return;
    }

    const properties = schema.properties as Record<string, unknown> | undefined;
    if (properties && Object.hasOwn(properties, segment.name)) {
      walk(properties[segment.name], index + 1, new Set());
    }
  }
}
