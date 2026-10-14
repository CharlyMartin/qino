import { describe, expect, test } from "vitest";

import { collectJsonSchemaTypes } from "./collect-json-schema-types";

function collect(node: unknown, root: Record<string, unknown> = {}) {
  return [...collectJsonSchemaTypes(root, node)].sort();
}

describe("collectJsonSchemaTypes", () => {
  test("reads type", () => {
    expect(collect({ type: "string" })).toEqual(["string"]);
    expect(collect({ type: ["number", "null"] })).toEqual(["null", "number"]);
  });

  test("collects every union branch, whatever their order", () => {
    expect(collect({ anyOf: [{ type: "null" }, { type: "string" }] })).toEqual([
      "null",
      "string",
    ]);
    expect(collect({ oneOf: [{ type: "string" }, { type: "array" }] })).toEqual(
      ["array", "string"],
    );
    expect(
      collect({
        allOf: [{ type: "string" }, { anyOf: [{ type: "integer" }] }],
      }),
    ).toEqual(["integer", "string"]);
  });

  test("resolves local $refs", () => {
    const root = { $defs: { Title: { type: "string" } } };

    expect(collect({ $ref: "#/$defs/Title" }, root)).toEqual(["string"]);
  });

  test("falls back to const and enum values", () => {
    expect(collect({ const: "draft" })).toEqual(["string"]);
    expect(collect({ enum: [1, null] })).toEqual(["null", "number"]);
  });

  test("gives unknown without type information", () => {
    expect(collect({})).toEqual(["unknown"]);
  });

  test("does not loop on recursive $refs", () => {
    const root = { $defs: { Node: { anyOf: [{ $ref: "#/$defs/Node" }] } } };

    expect(collect({ $ref: "#/$defs/Node" }, root)).toEqual([]);
  });
});
