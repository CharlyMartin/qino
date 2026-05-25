import { describe, expect, test } from "vitest";
import { z } from "zod";

import { validateJsonFile } from "./validate-json-file";

describe("validateJsonFile", () => {
  test("parses JSON and validates against the schema", () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const result = validateJsonFile({
      schema,
      raw: '{"name":"Alice","age":30}',
      filePath: "/fixtures/ok.json",
    });
    expect(result).toEqual({ name: "Alice", age: 30 });
  });

  test("propagates validation errors with the supplied filePath", () => {
    const schema = z.object({ name: z.string() });
    expect(() =>
      validateJsonFile({
        schema,
        raw: '{"name":42}',
        filePath: "/fixtures/bad.json",
      }),
    ).toThrow(/\/fixtures\/bad\.json.*name/s);
  });

  test("lets JSON.parse SyntaxError propagate as-is", () => {
    const schema = z.object({});
    expect(() =>
      validateJsonFile({
        schema,
        raw: "{ not json",
        filePath: "/fixtures/broken.json",
      }),
    ).toThrow(SyntaxError);
  });
});
