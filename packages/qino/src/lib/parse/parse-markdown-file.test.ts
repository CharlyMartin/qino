import { describe, expect, test } from "vitest";
import { z } from "zod";

import { MARKDOWN_BODY_FIELD_NAME } from "../../data";
import { validate } from "../validate";
import { parseMarkdownFile } from "./parse-markdown-file";

describe("parseMarkdownFile", () => {
  test.each([
    "md",
    "mdx",
  ])("validates frontmatter dates as strings in .%s files", (extension) => {
    const schema = z.object({ date: z.string(), body: z.string() });
    const result = parseMarkdownFile({
      schema,
      data: "---\ndate: 2023-11-14\n---\n# Body",
      filePath: `/fixtures/post.${extension}`,
      validatorFn: validate,
    });
    expect(result).toEqual({ date: "2023-11-14", body: "# Body" });
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

  test("exposes the body under the `body` field and merges frontmatter", () => {
    const schema = z.object({
      title: z.string(),
      [MARKDOWN_BODY_FIELD_NAME]: z.string(),
    });
    const raw = ["---", "title: Hello", "---", "", "# Body"].join("\n");
    const result = parseMarkdownFile({
      schema,
      data: raw,
      filePath: "/fixtures/post.md",
      validatorFn: validate,
    });
    expect(result.title).toBe("Hello");
    expect(result[MARKDOWN_BODY_FIELD_NAME].trim()).toBe("# Body");
  });

  test("rejects scalar frontmatter before spreading it into fields", () => {
    expect(() =>
      parseMarkdownFile({
        schema: z.object({ body: z.string() }),
        data: "---\nhello\n---\n# Body",
        filePath: "/fixtures/scalar.md",
        validatorFn: validate,
      }),
    ).toThrow("YAML frontmatter must be a mapping");
  });

  test("body overrides a frontmatter `body` key (spread order)", () => {
    const schema = z.object({ [MARKDOWN_BODY_FIELD_NAME]: z.string() });
    const raw = [
      "---",
      "[MARKDOWN_BODY_FIELD_NAME]: from-frontmatter",
      "---",
      "body here",
    ].join("\n");
    const result = parseMarkdownFile({
      schema,
      data: raw,
      filePath: "/fixtures/override.md",
      validatorFn: validate,
    });
    expect(result[MARKDOWN_BODY_FIELD_NAME].trim()).toBe("body here");
  });

  test("handles raw with no frontmatter (only body is exposed)", () => {
    const schema = z.object({ [MARKDOWN_BODY_FIELD_NAME]: z.string() });
    const result = parseMarkdownFile({
      schema,
      data: "just the body",
      filePath: "/fixtures/plain.md",
      validatorFn: validate,
    });
    expect(result.body).toBe("just the body");
  });

  test("propagates validation errors with the supplied filePath", () => {
    const schema = z.object({
      title: z.string(),
      [MARKDOWN_BODY_FIELD_NAME]: z.string(),
    });
    const raw = ["---", "title: 42", "---", "body"].join("\n");
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
