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
