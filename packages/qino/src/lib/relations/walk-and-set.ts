import { JSON_PATH_ARRAY } from "../../runtime/globals";
import type { Segment } from "./parse-path";

export async function walkAndSet(
  value: unknown,
  segments: ReadonlyArray<Segment>,
  setLeaf: (leaf: unknown) => Promise<unknown>,
): Promise<unknown> {
  if (segments.length == 0) {
    return setLeaf(value);
  }

  const [head, ...rest] = segments;

  if (head.kind == "array") {
    if (!Array.isArray(value)) {
      throw new Error(
        `Expected array at "${JSON_PATH_ARRAY}" segment; got ${typeof value == "object" ? (value === null ? "null" : "object") : typeof value}.`,
      );
    }
    return Promise.all(value.map((item) => walkAndSet(item, rest, setLeaf)));
  }

  if (value === null || typeof value != "object" || Array.isArray(value)) {
    return value;
  }

  const obj = value as Record<string, unknown>;
  if (!(head.name in obj)) {
    return value;
  }

  const newChild = await walkAndSet(obj[head.name], rest, setLeaf);

  return { ...obj, [head.name]: newChild };
}
