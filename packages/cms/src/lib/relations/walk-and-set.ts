import { JSON_PATH_ARRAY } from "../../data/globals";
import type { Segment } from "./parse-path";

type WalkAndSetParams = {
  value: unknown;
  segments: ReadonlyArray<Segment>;
  setLeaf: (leaf: unknown) => Promise<unknown>;
};

export async function walkAndSet({
  value,
  segments,
  setLeaf,
}: WalkAndSetParams): Promise<unknown> {
  const [head, ...rest] = segments;
  if (!head) {
    return setLeaf(value);
  }

  if (head.kind == "array") {
    // A nullable array stays as is, like a null object at a key segment.
    if (value == null) return value;

    if (!Array.isArray(value)) {
      throw new Error(
        `Expected array at "${JSON_PATH_ARRAY}" segment; got ${typeof value}.`,
      );
    }

    return Promise.all(
      value.map((item) => walkAndSet({ value: item, segments: rest, setLeaf })),
    );
  }

  if (value === null || typeof value != "object" || Array.isArray(value)) {
    return value;
  }

  const obj = value as Record<string, unknown>;

  if (!(head.name in obj)) {
    return value;
  }

  const newChild = await walkAndSet({
    value: obj[head.name],
    segments: rest,
    setLeaf,
  });

  return { ...obj, [head.name]: newChild };
}
