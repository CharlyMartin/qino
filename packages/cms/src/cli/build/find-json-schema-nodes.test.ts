import { describe, expect, test } from "vitest";
import { z } from "zod";

import { parsePath } from "../../lib/relations/parse-path";
import { findJsonSchemaNodes } from "./find-json-schema-nodes";
import { serializeJsonSchema } from "./serialize-json-schema";

describe("findJsonSchemaNodes", () => {
  test("finds the path in every union branch", () => {
    const schema = serializeJsonSchema(
      z.object({
        seo: z.union([
          z.object({ image: z.string() }),
          z.object({ image: z.number() }),
          z.object({ title: z.string() }),
        ]),
      }),
      "posts",
    );

    expect(findJsonSchemaNodes(schema, parsePath("seo.image"))).toEqual([
      { type: "string" },
      { type: "number" },
    ]);
  });

  test("finds a top-level field in every root branch", () => {
    const schema = serializeJsonSchema(
      z.union([
        z.object({ title: z.string() }),
        z.object({ title: z.array(z.string()) }),
      ]),
      "posts",
    );

    expect(findJsonSchemaNodes(schema, parsePath("title"))).toEqual([
      { type: "string" },
      { type: "array", items: { type: "string" } },
    ]);
  });

  test("follows $refs and array items", () => {
    const schema = {
      type: "object",
      properties: {
        gallery: { type: "array", items: { $ref: "#/$defs/Url" } },
      },
      $defs: { Url: { type: "string" } },
    };

    expect(findJsonSchemaNodes(schema, parsePath("gallery[*]"))).toEqual([
      { type: "string" },
    ]);
  });

  test("keeps the last node's own union", () => {
    const image = { anyOf: [{ type: "string" }, { type: "null" }] };
    const schema = { type: "object", properties: { image } };

    expect(findJsonSchemaNodes(schema, parsePath("image"))).toEqual([image]);
  });

  test("is empty when the path doesn't exist", () => {
    const schema = {
      type: "object",
      properties: { title: { type: "string" } },
    };

    expect(findJsonSchemaNodes(schema, parsePath("image"))).toEqual([]);
  });
});
