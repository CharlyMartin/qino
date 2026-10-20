import { describe, expect, test } from "vitest";
import { z } from "zod";

import { assertMediaFields } from "./assert-media-fields";
import { serializeJsonSchema } from "./serialize-json-schema";

const jsonSchema = {
  type: "object",
  properties: {
    image: { type: "string" },
    cover: { anyOf: [{ type: "string" }, { type: "null" }] },
    gallery: { type: "array", items: { type: "string" } },
    seo: { type: "object", properties: { image: { $ref: "#/$defs/Url" } } },
    author: { type: "string" },
    views: { type: "integer" },
    anything: {},
  },
  $defs: { Url: { type: "string" } },
};

function assert(fields: Array<string>, relationPaths: Array<string> = []) {
  assertMediaFields({
    fields,
    relationPaths,
    jsonSchema,
    primitiveId: "posts",
  });
}

describe("assertMediaFields", () => {
  test("accepts paths to strings", () => {
    expect(() =>
      assert(["image", "cover", "gallery[*]", "seo.image"]),
    ).not.toThrow();
  });

  test("accepts no fields", () => {
    expect(() => assert([])).not.toThrow();
  });

  test("rejects a malformed path", () => {
    expect(() => assert(["seo..image"])).toThrow(
      'media "seo..image" of "posts" isn\'t a valid path: Invalid relation path "seo..image": empty segment.',
    );
  });

  test("rejects a path missing from the schema input", () => {
    expect(() => assert(["thumbnail"])).toThrow(
      'media "thumbnail" of "posts" isn\'t a field of its schema input. Use the on-disk field name.',
    );
  });

  test.each(["views", "gallery", "seo", "anything"])(
    "rejects non-string field %s",
    (field) => {
      expect(() => assert([field])).toThrow(
        `media "${field}" of "posts" isn't a string on disk.`,
      );
    },
  );

  test("rejects a relation path", () => {
    expect(() => assert(["author"], ["author"])).toThrow(
      'media "author" of "posts" is also a relation. A field holds either a media URL or a reference.',
    );
  });

  test("rejects a path that isn't a string in every union branch", () => {
    const schema = serializeJsonSchema(
      z.object({
        seo: z.union([
          z.object({ image: z.string() }),
          z.object({ image: z.number() }),
        ]),
      }),
      "posts",
    );

    expect(() =>
      assertMediaFields({
        fields: ["seo.image"],
        relationPaths: [],
        jsonSchema: schema,
        primitiveId: "posts",
      }),
    ).toThrow('media "seo.image" of "posts" isn\'t a string on disk.');
  });

  test("accepts a field an intersection narrows to a string", () => {
    const schema = serializeJsonSchema(
      z.object({ image: z.unknown().and(z.string()) }),
      "posts",
    );

    expect(() =>
      assertMediaFields({
        fields: ["image"],
        relationPaths: [],
        jsonSchema: schema,
        primitiveId: "posts",
      }),
    ).not.toThrow();
  });
});
