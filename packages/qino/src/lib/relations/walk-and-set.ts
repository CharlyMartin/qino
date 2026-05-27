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
  if (segments.length == 0) {
    return setLeaf(value);
  }

  const [head, ...rest] = segments;

  if (head.kind == "array") {
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
