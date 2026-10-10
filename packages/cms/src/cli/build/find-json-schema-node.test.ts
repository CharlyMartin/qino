import { describe, expect, test } from "vitest";

import { parsePath } from "../../lib/relations/parse-path";
import { findJsonSchemaNode } from "./find-json-schema-node";

const schema = {
  type: "object",
  properties: {
    author: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    meta: {
      anyOf: [
        {
          type: "object",
          properties: { editors: { type: "array", items: { type: "string" } } },
        },
        { type: "null" },
      ],
    },
    related: { $ref: "#/$defs/Related" },
  },
  $defs: {
    Related: {
      type: "array",
      items: { type: "object", properties: { post: { type: "string" } } },
    },
  },
};

function find(path: string) {
  return findJsonSchemaNode(schema, parsePath(path));
}

describe("findJsonSchemaNode", () => {
  test("follows properties", () => {
    expect(find("author")).toEqual({ type: "string" });
  });

  test("follows array items", () => {
    expect(find("tags[*]")).toEqual({ type: "string" });
  });

  test("searches anyOf branches", () => {
    expect(find("meta.editors[*]")).toEqual({ type: "string" });
  });

  test("resolves local $refs", () => {
    expect(find("related[*].post")).toEqual({ type: "string" });
  });

  test("returns undefined for unknown paths", () => {
    expect(find("authorId")).toBeUndefined();
    expect(find("author[*]")).toBeUndefined();
    expect(find("meta.missing")).toBeUndefined();
  });

  test("does not loop on recursive $refs", () => {
    const recursive = {
      $ref: "#/$defs/Node",
      $defs: { Node: { anyOf: [{ $ref: "#/$defs/Node" }] } },
    };

    expect(findJsonSchemaNode(recursive, parsePath("child"))).toBeUndefined();
  });
});
