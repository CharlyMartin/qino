import { resolveJsonSchemaRef } from "./resolve-json-schema-ref";

type JsonSchema = Record<string, unknown>;

/** The types a node allows, `undefined` when it allows any. */
type Types = Set<string> | undefined;

/**
 * Lists every type a JSON Schema node allows, following local `$ref`s.
 * `anyOf` / `oneOf` branches add up, while `allOf` branches and sibling
 * keywords narrow each other: `allOf: [{}, { type: "string" }]` only allows
 * strings. Without `type`, falls back to the types of `const` / `enum`
 * values. A node allowing any type gives `"unknown"`.
 */
export function collectJsonSchemaTypes(root: JsonSchema, node: unknown) {
  return collect(node, new Set()) ?? new Set(["unknown"]);

  function collect(current: unknown, seen: Set<unknown>): Types {
    if (current === false || seen.has(current)) return new Set();
    if (typeof current != "object" || current == null) return undefined;

    const schema = current as JsonSchema;
    const nextSeen = new Set(seen).add(current);

    if (typeof schema.$ref == "string") {
      return collect(resolveJsonSchemaRef(root, schema.$ref), nextSeen);
    }

    let types = ownTypes(schema);

    for (const combinator of ["anyOf", "oneOf"] as const) {
      const branches = schema[combinator];
      if (!Array.isArray(branches) || branches.length == 0) continue;

      types = intersect(
        types,
        union(branches.map((branch) => collect(branch, nextSeen))),
      );
    }

    if (Array.isArray(schema.allOf)) {
      for (const branch of schema.allOf) {
        types = intersect(types, collect(branch, nextSeen));
      }
    }

    return types;
  }
}

function ownTypes(schema: JsonSchema): Types {
  if (typeof schema.type == "string") return new Set([schema.type]);
  if (Array.isArray(schema.type)) return new Set(schema.type.map(String));

  if ("const" in schema || Array.isArray(schema.enum)) {
    const values = "const" in schema ? [schema.const] : schema.enum;
    return new Set(
      (values as Array<unknown>).map((value) =>
        value === null ? "null" : typeof value,
      ),
    );
  }

  return undefined;
}

function union(list: Array<Types>): Types {
  if (list.some((types) => types == undefined)) return undefined;
  return new Set(list.flatMap((types) => [...(types ?? [])]));
}

/** Integers are numbers, so `number` and `integer` only allow integers. */
function intersect(a: Types, b: Types): Types {
  if (a == undefined) return b;
  if (b == undefined) return a;

  const types = new Set<string>();
  for (const type of a) {
    if (b.has(type)) types.add(type);
    else if (type == "integer" && b.has("number")) types.add(type);
    else if (type == "number" && b.has("integer")) types.add("integer");
  }
  return types;
}
