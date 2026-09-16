import type { StandardSchemaV1 } from "@standard-schema/spec";
import { describe, expect, test } from "vitest";
import { z } from "zod";

import { MARKDOWN_FIELD_NAME } from "../../data/globals";
import { validate } from "../validate/validate";
import { parseMarkdownFile } from "./parse-markdown-file";

describe("parseMarkdownFile", () => {
  test.each([
    "md",
    "mdx",
  ])("validates frontmatter dates as strings in .%s files", (extension) => {
    const schema = z.object({ date: z.string(), markdown: z.string() });
    const result = parseMarkdownFile({
      schema,
      data: "---\ndate: 2023-11-14\n---\n# Body",
      filePath: `/fixtures/post.${extension}`,
      validatorFn: validate,
    });
    expect(result).toEqual({ date: "2023-11-14", markdown: "# Body" });
  });

  test("allows schemas to explicitly convert date strings into dates", () => {
    const schema = z.object({ date: z.string().pipe(z.coerce.date()) });
    const result = parseMarkdownFile({
      schema,
      data: "---\ndate: 2023-11-14\n---\n",
      filePath: "/fixtures/post.md",
      validatorFn: validate,
    });
    expect(result.date).toEqual(new Date("2023-11-14"));
  });

  test("exposes the body under the `markdown` field and merges frontmatter", () => {
    const schema = z.object({
      title: z.string(),
      markdown: z.string(),
    });
    const raw = ["---", "title: Hello", "---", "", "# Body"].join("\n");
    const result = parseMarkdownFile({
      schema,
      data: raw,
      filePath: "/fixtures/post.md",
      validatorFn: validate,
    });
    expect(result.title).toBe("Hello");
    expect(result[MARKDOWN_FIELD_NAME].trim()).toBe("# Body");
  });

  test("rejects scalar frontmatter before spreading it into fields", () => {
    expect(() =>
      parseMarkdownFile({
        schema: z.object({}),
        data: "---\nhello\n---\n# Body",
        filePath: "/fixtures/scalar.md",
        validatorFn: validate,
      }),
    ).toThrow("YAML frontmatter must be a mapping");
  });

  test("rejects a frontmatter markdown field instead of overwriting it", () => {
    const schema = z.object({ markdown: z.string() });
    const raw = [
      "---",
      `${MARKDOWN_FIELD_NAME}: from-frontmatter`,
      "---",
      "markdown here",
    ].join("\n");
    expect(() =>
      parseMarkdownFile({
        schema,
        data: raw,
        filePath: "/fixtures/override.md",
        validatorFn: validate,
      }),
    ).toThrow(
      "/fixtures/override.md: fields reserved for Qino cannot appear in content or schema output: markdown.",
    );
  });

  test.each([
    z.object({ title: z.string(), markdown: z.string() }),
    z.strictObject({ title: z.string(), markdown: z.string() }),
  ])("preserves original markdown when declared as a string", (schema) => {
    const markdown = "\n# Hello\n\n  Some text  \n";
    expect(
      parseMarkdownFile({
        schema,
        data: `---\ntitle: Hello\n---\n${markdown}`,
        filePath: "/fixtures/post.md",
        validatorFn: validate,
      }),
    ).toEqual({ title: "Hello", markdown });
  });

  test("adds empty markdown when the document only has frontmatter", () => {
    expect(
      parseMarkdownFile({
        schema: z.object({ title: z.string(), markdown: z.string() }),
        data: "---\ntitle: Hello\n---\n",
        filePath: "/fixtures/empty.md",
        validatorFn: validate,
      }),
    ).toEqual({ title: "Hello", markdown: "" });
  });

  test("handles raw with no frontmatter (only markdown is exposed)", () => {
    const schema = z.object({ markdown: z.string() });
    const result = parseMarkdownFile({
      schema,
      data: "just the markdown",
      filePath: "/fixtures/plain.md",
      validatorFn: validate,
    });
    expect(result.markdown).toBe("just the markdown");
  });

  test("propagates validation errors with the supplied filePath", () => {
    const schema = z.object({
      title: z.string(),
      markdown: z.string(),
    });
    const raw = ["---", "title: 42", "---", "markdown"].join("\n");
    expect(() =>
      parseMarkdownFile({
        schema,
        data: raw,
        filePath: "/fixtures/bad.md",
        validatorFn: validate,
      }),
    ).toThrow(/\/fixtures\/bad\.md.*title/s);
  });
});

test.each([
  ".md",
  ".mdx",
  ".markdown",
])("schema controls markdown in %s", (extension) => {
  const params = {
    data: "# Hello",
    filePath: `/entry${extension}`,
    validatorFn: validate,
  };
  expect(
    parseMarkdownFile({
      ...params,
      schema: z.object({
        markdown: z.string().transform((text) => text.length),
      }),
    }),
  ).toEqual({ markdown: 7 });
  expect(parseMarkdownFile({ ...params, schema: z.object({}) })).toEqual({});
  expect(
    parseMarkdownFile({ ...params, schema: z.object({}).passthrough() }),
  ).toEqual({ markdown: "# Hello" });
  expect(() =>
    parseMarkdownFile({ ...params, schema: z.strictObject({}) }),
  ).toThrow("Validation failed");
  expect(() =>
    parseMarkdownFile({
      ...params,
      schema: z.object({ markdown: z.number() }),
    }),
  ).toThrow("markdown");
  expect(
    parseMarkdownFile({
      ...params,
      data: "",
      schema: z.object({ markdown: z.string() }),
    }),
  ).toEqual({ markdown: "" });
});

test("supports transformed output from a non-Zod Standard Schema", () => {
  const schema: StandardSchemaV1<unknown, { markdown: number }> = {
    "~standard": {
      version: 1,
      vendor: "test",
      validate: (input) => {
        const markdown = (input as { markdown: unknown }).markdown;
        return typeof markdown == "string"
          ? { value: { markdown: markdown.length } }
          : { issues: [{ message: "Expected a string" }] };
      },
    },
  };
  expect(
    parseMarkdownFile({
      schema,
      data: "# Hello",
      filePath: "/entry.mdx",
      validatorFn: validate,
    }),
  ).toEqual({ markdown: 7 });
});
