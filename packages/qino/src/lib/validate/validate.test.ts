import type { StandardSchemaV1 } from "@standard-schema/spec";
import { describe, expect, test } from "vitest";
import { z } from "zod";

import { validate } from "./validate";

describe("validate", () => {
  test("returns the parsed value on success", () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const result = validate(
      schema,
      { name: "Alice", age: 30 },
      "/fixtures/ok.json",
    );
    expect(result).toEqual({ name: "Alice", age: 30 });
  });

  test("throws including filePath and joined issue paths on failure", () => {
    const schema = z.object({
      name: z.string(),
      nested: z.object({ age: z.number() }),
    });
    expect(() =>
      validate(
        schema,
        { name: 42, nested: { age: "thirty" } },
        "/fixtures/bad.json",
      ),
    ).toThrow(/\/fixtures\/bad\.json/);
    expect(() =>
      validate(
        schema,
        { name: 42, nested: { age: "thirty" } },
        "/fixtures/bad.json",
      ),
    ).toThrow(/nested\.age/);
  });

  test("formats path segments that are objects with a `key` property", () => {
    const schema = makeFailingSchema([
      { message: "bad", path: [{ key: "foo" }, { key: "bar" }] },
    ]);
    expect(() =>
      validate(schema, {}, "/fixtures/object-segments.json"),
    ).toThrow(/foo\.bar: bad/);
  });

  test("formats empty/missing paths as (root)", () => {
    const noPath = makeFailingSchema([{ message: "nope" }]);
    expect(() => validate(noPath, {}, "/fixtures/no-path.json")).toThrow(
      /\(root\): nope/,
    );

    const emptyPath = makeFailingSchema([{ message: "still nope", path: [] }]);
    expect(() => validate(emptyPath, {}, "/fixtures/empty-path.json")).toThrow(
      /\(root\): still nope/,
    );
  });

  test("throws when the validator returns a Promise (async)", () => {
    const asyncSchema: StandardSchemaV1 = {
      "~standard": {
        version: 1,
        vendor: "test",
        validate: async () => ({ value: {} }),
      },
    };
    expect(() => validate(asyncSchema, {}, "/fixtures/async.json")).toThrow(
      /\/fixtures\/async\.json.*synchronous/i,
    );
  });
});

function makeFailingSchema(
  issues: ReadonlyArray<StandardSchemaV1.Issue>,
): StandardSchemaV1 {
  return {
    "~standard": {
      version: 1,
      vendor: "test",
      validate: () => ({ issues }),
    },
  };
}
