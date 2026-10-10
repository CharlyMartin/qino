import type { Segment } from "../../lib/relations/parse-path";

/**
 * Collects the values at a relation path, flattening `[*]` segments. Missing
 * keys and non-array values at `[*]` yield nothing, so absent optional fields
 * compare equal.
 */
export function collectPathValues(
  value: unknown,
  segments: ReadonlyArray<Segment>,
): Array<unknown> {
  const [head, ...rest] = segments;
  if (!head) return [value];

  if (head.kind == "array") {
    return Array.isArray(value)
      ? value.flatMap((item) => collectPathValues(item, rest))
      : [];
  }

  if (value == null || typeof value != "object" || Array.isArray(value)) {
    return [];
  }

  const obj = value as Record<string, unknown>;
  return Object.hasOwn(obj, head.name)
    ? collectPathValues(obj[head.name], rest)
    : [];
}
