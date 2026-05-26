import { describe, expect, test } from "vitest";
import { z } from "zod";

import { validate } from "../validate";
import { parseJsonFile } from "./parse-json-file";

describe("parseJsonFile", () => {
  test("parses JSON and validates against the schema", () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const result = parseJsonFile({
      schema,
      data: '{"name":"Alice","age":30}',
      filePath: "/fixtures/ok.json",
      validatorFn: validate,
    });
    expect(result).toEqual({ name: "Alice", age: 30 });
  });

  test("propagates validation errors with the supplied filePath", () => {
    const schema = z.object({ name: z.string() });
    expect(() =>
      parseJsonFile({
        schema,
        data: '{"name":42}',
        filePath: "/fixtures/bad.json",
        validatorFn: validate,
      }),
    ).toThrow(/\/fixtures\/bad\.json.*name/s);
  });

  test("lets JSON.parse SyntaxError propagate as-is", () => {
    const schema = z.object({});
    expect(() =>
      parseJsonFile({
        schema,
        data: "{ not json",
        filePath: "/fixtures/broken.json",
        validatorFn: validate,
      }),
    ).toThrow(SyntaxError);
  });
});
