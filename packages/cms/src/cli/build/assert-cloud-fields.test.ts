import { describe, expect, test } from "vitest";
import { z } from "zod";

import { assertCloudFields } from "./assert-cloud-fields";
import { serializeJsonSchema } from "./serialize-json-schema";

const jsonSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    views: { type: "integer" },
    draft: { type: "boolean" },
    subtitle: { anyOf: [{ type: "string" }, { type: "null" }] },
    rating: { type: ["number", "null"] },
    tags: { type: "array", items: { type: "string" } },
    nullFirst: { anyOf: [{ type: "null" }, { type: "string" }] },
    status: { enum: ["draft", "published"] },
    kind: { const: "post" },
    permalink: { $ref: "#/$defs/Slug" },
    stringFirst: { anyOf: [{ type: "string" }, { type: "array" }] },
    anything: {},
    nothing: { type: "null" },
  },
  $defs: { Slug: { type: "string" } },
};

describe("assertCloudFields", () => {
  test("accepts on-disk fields", () => {
    expect(() =>
      assertCloudFields(
        {
          searchableBy: ["title", "tags"],
          sortableBy: [
            "title",
            "views",
            "draft",
            "subtitle",
            "rating",
            "nullFirst",
            "status",
            "kind",
            "permalink",
          ],
        },
        jsonSchema,
        "posts",
      ),
    ).not.toThrow();
  });

  test("accepts no fields", () => {
    expect(() => assertCloudFields({}, jsonSchema, "posts")).not.toThrow();
  });

  test.each(["searchableBy", "sortableBy", "hiddenFields"] as const)(
    "rejects a %s field missing from the schema input",
    (option) => {
      expect(() =>
        assertCloudFields({ [option]: ["slug"] }, jsonSchema, "posts"),
      ).toThrow(
        `${option} "slug" of "posts" isn't a field of its schema input. Use the on-disk field name.`,
      );
    },
  );

  test.each(["tags", "stringFirst", "anything", "nothing"])(
    "rejects non-scalar sortableBy field %s",
    (field) => {
      expect(() =>
        assertCloudFields({ sortableBy: [field] }, jsonSchema, "posts"),
      ).toThrow(
        `sortableBy "${field}" of "posts" isn't a string, number, or boolean on disk.`,
      );
    },
  );

  test.each([
    ["null first", z.union([z.null(), z.string().min(1)])],
    ["null last", z.union([z.string().min(1), z.null()])],
  ])("accepts a nullable zod string, %s", (_, title) => {
    const schema = serializeJsonSchema(z.object({ title }), "posts");

    expect(() =>
      assertCloudFields({ sortableBy: ["title"] }, schema, "posts"),
    ).not.toThrow();
  });

  test("rejects a zod string-or-array union, string first", () => {
    const title = z.union([z.string(), z.array(z.string())]);
    const schema = serializeJsonSchema(z.object({ title }), "posts");

    expect(() =>
      assertCloudFields({ sortableBy: ["title"] }, schema, "posts"),
    ).toThrow('sortableBy "title" of "posts" isn\'t a string');
  });

  test("accepts optional and defaulted hiddenFields", () => {
    const schema = serializeJsonSchema(
      z.object({
        title: z.string(),
        notes: z.string().optional(),
        status: z.string().default("draft"),
      }),
      "posts",
    );

    expect(() =>
      assertCloudFields({ hiddenFields: ["notes", "status"] }, schema, "posts"),
    ).not.toThrow();
  });

  test("rejects a required hiddenFields field without a default", () => {
    const schema = serializeJsonSchema(
      z.object({ title: z.string() }),
      "posts",
    );

    expect(() =>
      assertCloudFields({ hiddenFields: ["title"] }, schema, "posts"),
    ).toThrow(
      'hiddenFields "title" of "posts" is required without a default, so editors couldn\'t create entries. Make it optional or give it a default.',
    );
  });

  test("accepts a required hiddenFields field with a default", () => {
    const schema = {
      type: "object",
      properties: { status: { type: "string", default: "draft" } },
      required: ["status"],
    };

    expect(() =>
      assertCloudFields({ hiddenFields: ["status"] }, schema, "posts"),
    ).not.toThrow();
  });

  test("rejects a hiddenFields field one union variant requires", () => {
    const schema = serializeJsonSchema(
      z.discriminatedUnion("kind", [
        z.object({ kind: z.literal("a"), secret: z.string() }),
        z.object({ kind: z.literal("b"), secret: z.string().optional() }),
      ]),
      "posts",
    );

    expect(() =>
      assertCloudFields({ hiddenFields: ["secret"] }, schema, "posts"),
    ).toThrow('hiddenFields "secret" of "posts" is required without a default');
  });

  test("rejects a sortableBy field non-scalar in any root union branch", () => {
    const schema = serializeJsonSchema(
      z.union([
        z.object({ title: z.string() }),
        z.object({ title: z.array(z.string()) }),
      ]),
      "posts",
    );

    expect(() =>
      assertCloudFields({ sortableBy: ["title"] }, schema, "posts"),
    ).toThrow('sortableBy "title" of "posts" isn\'t a string');
  });
});
