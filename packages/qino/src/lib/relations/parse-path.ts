import { JSON_PATH_ARRAY } from "../../data/globals";

export type Segment = { kind: "key"; name: string } | { kind: "array" };

export function parsePath(path: string) {
  if (path == "") {
    throw new Error("Relation path cannot be empty.");
  }

  const segments: Array<Segment> = [];

  for (const part of path.split(".")) {
    if (part == "") {
      throw new Error(`Invalid relation path "${path}": empty segment.`);
    }

    if (part.endsWith(JSON_PATH_ARRAY)) {
      const name = part.slice(0, -JSON_PATH_ARRAY.length);

      if (name == "") {
        throw new Error(
          `Invalid relation path "${path}": bare "${JSON_PATH_ARRAY}" segment.`,
        );
      }

      segments.push({ kind: "key", name });
      segments.push({ kind: "array" });
    } else {
      segments.push({ kind: "key", name: part });
    }
  }

  return segments;
}
