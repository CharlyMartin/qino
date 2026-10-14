import { describe, expect, test } from "vitest";
import { z } from "zod";

import type { ObjectSchema } from "../../types/schema";
import { serializeJsonSchema } from "./serialize-json-schema";

describe("serializeJsonSchema", () => {
  test("converts a schema to draft 2020-12 JSON Schema", () => {
    const schema = z
      .object({ title: z.string(), tags: z.array(z.string()) })
      .strict();

    expect(serializeJsonSchema(schema, "posts")).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        title: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
      },
      required: ["title", "tags"],
      additionalProperties: false,
    });
  });

  test("describes the input side of transformed schemas", () => {
    const schema = z
      .object({ "created-on": z.string() })
      .transform((post) => ({ createdOn: post["created-on"] }));

    expect(serializeJsonSchema(schema, "posts")).toMatchObject({
      properties: { "created-on": { type: "string" } },
    });
  });

  test("keeps validation constraints", () => {
    const schema = z.object({
      title: z.string().min(3).max(80),
      slug: z.string().regex(/^[a-z0-9-]+$/),
      email: z.email(),
      rating: z.number().int().min(0).max(10),
      price: z.number().gt(0).multipleOf(0.5),
      status: z.enum(["draft", "published"]),
      tags: z.array(z.string()).min(1).max(5),
      featured: z.boolean().default(false),
      subtitle: z.string().optional(),
    });

    expect(serializeJsonSchema(schema, "posts")).toMatchObject({
      properties: {
        title: { type: "string", minLength: 3, maxLength: 80 },
        slug: { type: "string", pattern: "^[a-z0-9-]+$" },
        email: { type: "string", format: "email" },
        rating: { type: "integer", minimum: 0, maximum: 10 },
        price: { type: "number", exclusiveMinimum: 0, multipleOf: 0.5 },
        status: { type: "string", enum: ["draft", "published"] },
        tags: { type: "array", minItems: 1, maxItems: 5 },
        featured: { type: "boolean", default: false },
        subtitle: { type: "string" },
      },
      required: ["title", "slug", "email", "rating", "price", "status", "tags"],
    });
  });

  test("drops regex flags", () => {
    const schema = z.object({ code: z.string().regex(/^abc$/i) });

    expect(serializeJsonSchema(schema, "posts")).toMatchObject({
      properties: { code: { type: "string", pattern: "^abc$" } },
    });
  });

  test("omits refinements", () => {
    const schema = z.object({
      code: z.string().refine((value) => value.startsWith("x")),
    });

    expect(serializeJsonSchema(schema, "posts")).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: { code: { type: "string" } },
      required: ["code"],
    });
  });

  test("throws when the validator doesn't implement Standard JSON Schema", () => {
    const schema: ObjectSchema = {
      "~standard": {
        version: 1,
        vendor: "custom",
        validate: (value) => ({ value: value as Record<string, unknown> }),
      },
    };

    expect(() => serializeJsonSchema(schema, "posts")).toThrow(
      /"posts".*Standard JSON Schema/,
    );
  });

  test("throws when the conversion fails", () => {
    const schema = z.object({ date: z.date() });

    expect(() => serializeJsonSchema(schema, "posts")).toThrow(
      /Schema of "posts" can't be converted to JSON Schema/,
    );
  });
});
