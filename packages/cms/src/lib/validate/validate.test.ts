import type { StandardSchemaV1 } from "@standard-schema/spec";
import { describe, expect, test } from "vitest";
import { z } from "zod";

import { validate } from "./validate";

describe("validate", () => {
  test.each([
    "_meta",
  ])("rejects input %s before a schema can strip it", (field) => {
    expect(() =>
      validate({
        schema: z.object({ title: z.string() }),
        data: { title: "Hello", [field]: "conflict" },
        filePath: "/fixtures/input.md",
      }),
    ).toThrow(
      `/fixtures/input.md: fields reserved for Qino cannot appear in content or schema output: ${field}.`,
    );
  });

  test.each(["_meta"])("rejects %s introduced by a transform", (field) => {
    expect(() =>
      validate({
        schema: z.object({}).transform(() => ({ [field]: "conflict" })),
        data: {},
        filePath: "/fixtures/output.md",
      }),
    ).toThrow(
      `/fixtures/output.md: fields reserved for Qino cannot appear in content or schema output: ${field}.`,
    );
  });

  test("returns the parsed value on success", () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const result = validate({
      schema,
      data: { name: "Alice", age: 30 },
      filePath: "/fixtures/ok.json",
    });
    expect(result).toEqual({ name: "Alice", age: 30 });
  });

  test("throws including filePath and joined issue paths on failure", () => {
    const schema = z.object({
      name: z.string(),
      nested: z.object({ age: z.number() }),
    });
    expect(() =>
      validate({
        schema,
        data: { name: 42, nested: { age: "thirty" } },
        filePath: "/fixtures/bad.json",
      }),
    ).toThrow(/\/fixtures\/bad\.json/);
    expect(() =>
      validate({
        schema,
        data: { name: 42, nested: { age: "thirty" } },
        filePath: "/fixtures/bad.json",
      }),
    ).toThrow(/nested\.age/);
  });

  test("formats path segments that are objects with a `key` property", () => {
    const schema = makeFailingSchema([
      { message: "bad", path: [{ key: "foo" }, { key: "bar" }] },
    ]);
    expect(() =>
      validate({
        schema,
        data: {},
        filePath: "/fixtures/object-segments.json",
      }),
    ).toThrow(/foo\.bar: bad/);
  });

  test("formats empty/missing paths as (root)", () => {
    const noPath = makeFailingSchema([{ message: "nope" }]);
    expect(() =>
      validate({
        schema: noPath,
        data: {},
        filePath: "/fixtures/no-path.json",
      }),
    ).toThrow(/\(root\): nope/);

    const emptyPath = makeFailingSchema([{ message: "still nope", path: [] }]);
    expect(() =>
      validate({
        schema: emptyPath,
        data: {},
        filePath: "/fixtures/empty-path.json",
      }),
    ).toThrow(/\(root\): still nope/);
  });

  test("throws when the validator returns a Promise (async)", () => {
    const asyncSchema: StandardSchemaV1 = {
      "~standard": {
        version: 1,
        vendor: "test",
        validate: async () => ({ value: {} }),
      },
    };
    expect(() =>
      validate({
        schema: asyncSchema,
        data: {},
        filePath: "/fixtures/async.json",
      }),
    ).toThrow(/\/fixtures\/async\.json.*synchronous/i);
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
