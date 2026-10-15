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
  });

  test("narrows to the types every allOf branch allows", () => {
    expect(collect({ allOf: [{}, { type: "string" }] })).toEqual(["string"]);
    expect(
      collect({
        allOf: [
          { anyOf: [{ type: "string" }, { type: "array" }] },
          { type: ["string", "null"] },
        ],
      }),
    ).toEqual(["string"]);
    expect(collect({ allOf: [{ type: "string" }, { type: "array" }] })).toEqual(
      [],
    );
  });

  test("narrows numbers to integers", () => {
    expect(
      collect({ allOf: [{ type: "number" }, { type: "integer" }] }),
    ).toEqual(["integer"]);
  });

  test("narrows a type with its sibling unions", () => {
    expect(
      collect({
        type: ["string", "null"],
        anyOf: [{ type: "string" }, { type: "number" }],
      }),
    ).toEqual(["string"]);
  });

  test("gives unknown when a union branch allows any type", () => {
    expect(collect({ anyOf: [{}, { type: "string" }] })).toEqual(["unknown"]);
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
