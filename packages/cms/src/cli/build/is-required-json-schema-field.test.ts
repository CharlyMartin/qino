import { describe, expect, test } from "vitest";
import { z } from "zod";

import { isRequiredJsonSchemaField } from "./is-required-json-schema-field";
import { serializeJsonSchema } from "./serialize-json-schema";

describe("isRequiredJsonSchemaField", () => {
  test.each(["some", "every"] as const)(
    "reads zod's input JSON Schema, %s",
    (branches) => {
      const schema = serializeJsonSchema(
        z.object({
          title: z.string(),
          notes: z.string().optional(),
          status: z.string().default("draft"),
        }),
        "posts",
      );

      expect(isRequiredJsonSchemaField(schema, "title", branches)).toBe(true);
      expect(isRequiredJsonSchemaField(schema, "notes", branches)).toBe(false);
      expect(isRequiredJsonSchemaField(schema, "status", branches)).toBe(false);
    },
  );

  test("tells some union branches from every one", () => {
    const schema = serializeJsonSchema(
      z.discriminatedUnion("kind", [
        z.object({ kind: z.literal("a"), secret: z.string() }),
        z.object({ kind: z.literal("b"), secret: z.string().optional() }),
      ]),
      "posts",
    );

    expect(isRequiredJsonSchemaField(schema, "secret", "some")).toBe(true);
    expect(isRequiredJsonSchemaField(schema, "secret", "every")).toBe(false);
    expect(isRequiredJsonSchemaField(schema, "kind", "every")).toBe(true);
  });

  test.each(["anyOf", "oneOf"])("checks %s branches", (combinator) => {
    const every = { [combinator]: [{ required: ["a"] }, { required: ["a"] }] };
    const some = { [combinator]: [{ required: ["a"] }, { required: [] }] };
    const none = { [combinator]: [] };

    expect(isRequiredJsonSchemaField(every, "a", "every")).toBe(true);
    expect(isRequiredJsonSchemaField(some, "a", "every")).toBe(false);
    expect(isRequiredJsonSchemaField(some, "a", "some")).toBe(true);
    expect(isRequiredJsonSchemaField(none, "a", "some")).toBe(false);
  });

  test("ignores a required field with a default, per branch", () => {
    const schema = {
      oneOf: [
        {
          properties: { status: { type: "string", default: "draft" } },
          required: ["status"],
        },
        {
          properties: { status: { $ref: "#/$defs/Status" } },
          required: ["status"],
        },
      ],
      $defs: { Status: { type: "string", default: "draft" } },
    };
    const withoutDefault = {
      oneOf: [
        {
          properties: { status: { type: "string", default: "draft" } },
          required: ["status"],
        },
        { properties: { status: { type: "string" } }, required: ["status"] },
      ],
    };

    expect(isRequiredJsonSchemaField(schema, "status", "some")).toBe(false);
    expect(isRequiredJsonSchemaField(withoutDefault, "status", "some")).toBe(
      true,
    );
  });

  test("follows a root $ref", () => {
    const schema = {
      $ref: "#/$defs/Post",
      $defs: { Post: { type: "object", required: ["title"] } },
    };

    expect(isRequiredJsonSchemaField(schema, "title", "every")).toBe(true);
  });

  test("needs one allOf branch", () => {
    const schema = { allOf: [{ required: ["title"] }, { required: [] }] };

    expect(isRequiredJsonSchemaField(schema, "title", "every")).toBe(true);
  });

  test("stops on $ref cycles", () => {
    const schema = { $ref: "#", required: [] };

    expect(isRequiredJsonSchemaField(schema, "title", "some")).toBe(false);
  });
});
