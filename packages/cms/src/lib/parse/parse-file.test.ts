import { describe, expect, test } from "vitest";
import { z } from "zod";

import { MARKDOWN_FIELD_NAME } from "../../data/globals";
import { validate } from "../validate/validate";
import { parseFile } from "./parse-file";

describe("parseFile", () => {
  test("routes .json files through JSON parsing", () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const result = parseFile({
      schema,
      data: '{"name":"Alice","age":30}',
      filePath: "/fixtures/ok.json",
      validatorFn: validate,
    });
    expect(result).toEqual({ name: "Alice", age: 30 });
  });

  test("routes .md files through markdown parsing", () => {
    const schema = z.object({
      title: z.string(),
      markdown: z.string(),
    });
    const raw = ["---", "title: Hello", "---", "", "# Body"].join("\n");
    const result = parseFile({
      schema,
      data: raw,
      filePath: "/fixtures/post.md",
      validatorFn: validate,
    });
    expect(result.title).toBe("Hello");
    expect(result[MARKDOWN_FIELD_NAME].trim()).toBe("# Body");
  });

  test("routes .mdx and .markdown files through markdown parsing", () => {
    const schema = z.object({ markdown: z.string() });
    const raw = "markdown only";

    expect(
      parseFile({
        schema,
        data: raw,
        filePath: "/fixtures/post.mdx",
        validatorFn: validate,
      }).markdown,
    ).toBe("markdown only");

    expect(
      parseFile({
        schema,
        data: raw,
        filePath: "/fixtures/post.markdown",
        validatorFn: validate,
      }).markdown,
    ).toBe("markdown only");
  });

  test("propagates validation errors with the supplied filePath", () => {
    const schema = z.object({ name: z.string() });
    expect(() =>
      parseFile({
        schema,
        data: '{"name":42}',
        filePath: "/fixtures/bad.json",
        validatorFn: validate,
      }),
    ).toThrow(/\/fixtures\/bad\.json.*name/s);
  });
});
