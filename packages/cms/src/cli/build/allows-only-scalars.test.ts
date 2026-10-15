import { describe, expect, test } from "vitest";

import { allowsOnlyScalars } from "./allows-only-scalars";

const root = { $defs: { Slug: { type: "string" } } };

describe("allowsOnlyScalars", () => {
  test.each([
    { type: "string" },
    { type: "integer" },
    { type: ["number", "null"] },
    { anyOf: [{ type: "null" }, { type: "boolean" }] },
    { enum: ["draft", "published"] },
    { $ref: "#/$defs/Slug" },
  ])("accepts %o", (node) => {
    expect(allowsOnlyScalars(root, [node])).toBe(true);
  });

  test.each([
    { type: "array" },
    { type: "null" },
    {},
    { anyOf: [{ type: "string" }, { type: "object" }] },
  ])("rejects %o", (node) => {
    expect(allowsOnlyScalars(root, [node])).toBe(false);
  });

  test("needs every node to be scalar", () => {
    expect(
      allowsOnlyScalars(root, [{ type: "string" }, { type: "array" }]),
    ).toBe(false);
  });
});
