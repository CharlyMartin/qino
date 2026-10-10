import { describe, expect, test } from "vitest";

import { resolveJsonSchemaRef } from "./resolve-json-schema-ref";

const root = {
  $defs: { Post: { type: "object" }, "a/b": { type: "string" } },
};

describe("resolveJsonSchemaRef", () => {
  test("resolves local refs", () => {
    expect(resolveJsonSchemaRef(root, "#/$defs/Post")).toEqual({
      type: "object",
    });
  });

  test("decodes escaped segments", () => {
    expect(resolveJsonSchemaRef(root, "#/$defs/a~1b")).toEqual({
      type: "string",
    });
  });

  test("returns undefined for remote or missing refs", () => {
    expect(
      resolveJsonSchemaRef(root, "https://example.com/s.json"),
    ).toBeUndefined();
    expect(resolveJsonSchemaRef(root, "#/$defs/Missing")).toBeUndefined();
  });
});
