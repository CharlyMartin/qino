import { resolveJsonSchemaRef } from "./resolve-json-schema-ref";

type JsonSchema = Record<string, unknown>;

/**
 * Which `anyOf` / `oneOf` branches must require the field: `"some"` when one
 * variant requiring it is enough (hiding it would block that variant),
 * `"every"` when it must be there whatever the variant (naming entries).
 */
type Branches = "some" | "every";

/**
 * Whether an entry must provide a top-level field: required by the root JSON
 * Schema, without a `default` there. Follows local `$ref`s; one `allOf`
 * branch requiring it is enough, `anyOf` / `oneOf` branches per `branches`.
 */
export function isRequiredJsonSchemaField(
  root: JsonSchema,
  field: string,
  branches: Branches,
) {
  return isRequired(root, new Set());

  function isRequired(node: unknown, seen: Set<unknown>): boolean {
    if (typeof node != "object" || node == null || seen.has(node)) {
      return false;
    }

    const schema = node as JsonSchema;
    const nextSeen = new Set(seen).add(node);

    if (typeof schema.$ref == "string") {
      return isRequired(resolveJsonSchemaRef(root, schema.$ref), nextSeen);
    }

    if (
      Array.isArray(schema.required) &&
      schema.required.includes(field) &&
      !hasDefault(schema)
    ) {
      return true;
    }

    if (
      Array.isArray(schema.allOf) &&
      schema.allOf.some((branch) => isRequired(branch, nextSeen))
    ) {
      return true;
    }

    return (["anyOf", "oneOf"] as const).some((combinator) => {
      const options = schema[combinator];
      if (!Array.isArray(options) || options.length == 0) return false;

      return branches == "every"
        ? options.every((branch) => isRequired(branch, nextSeen))
        : options.some((branch) => isRequired(branch, nextSeen));
    });
  }

  function hasDefault(schema: JsonSchema) {
    const properties = schema.properties as Record<string, unknown> | undefined;
    const property = properties?.[field];
    if (typeof property != "object" || property == null) return false;
    if ("default" in property) return true;

    const ref = (property as JsonSchema).$ref;
    const resolved = typeof ref == "string" && resolveJsonSchemaRef(root, ref);
    return (
      typeof resolved == "object" && resolved != null && "default" in resolved
    );
  }
}
