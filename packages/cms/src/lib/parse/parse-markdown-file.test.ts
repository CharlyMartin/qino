import type { StandardSchemaV1 } from "@standard-schema/spec";
import { describe, expect, test } from "vitest";
import { z } from "zod";

import {
  MARKDOWN_FIELD_NAME,
  STATS_FIELD_NAME,
  TOC_FIELD_NAME,
} from "../../data/globals";
import { validate } from "../validate/validate";
import { parseMarkdownFile } from "./parse-markdown-file";

describe("parseMarkdownFile", () => {
  test.each(["md", "mdx"])(
    "validates frontmatter dates as strings in .%s files",
    (extension) => {
      const data = "---\ndate: 2023-11-14\n---\n# Body";
      const result = parseMarkdownFile({
        schema: z.object({ date: z.string() }),
        data,
        filePath: `/fixtures/post.${extension}`,
        validatorFn: validate,
      });
      expect(result).toEqual({ date: "2023-11-14", markdown: "# Body" });
    },
  );

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

  test("adds the body as `markdown` after validating frontmatter", () => {
    const raw = ["---", "title: Hello", "---", "", "# Body"].join("\n");
    const result = parseMarkdownFile({
      schema: z.object({ title: z.string() }),
      data: raw,
      filePath: "/fixtures/post.md",
      validatorFn: validate,
    });
    expect(result.title).toBe("Hello");
    expect(result[MARKDOWN_FIELD_NAME].trim()).toBe("# Body");
  });

  test("validates frontmatter only, so strict schemas accept the entry", () => {
    const markdown = "\n# Hello\n\n  Some text  \n";
    expect(
      parseMarkdownFile({
        schema: z.strictObject({ title: z.string() }),
        data: `---\ntitle: Hello\n---\n${markdown}`,
        filePath: "/fixtures/post.md",
        validatorFn: validate,
      }),
    ).toEqual({ title: "Hello", markdown });
  });

  test("never passes markdown to the schema", () => {
    let input: unknown;
    parseMarkdownFile({
      schema: z.unknown().transform((value) => {
        input = value;
        return {};
      }),
      data: "---\ntitle: Hello\n---\n# Body",
      filePath: "/fixtures/post.md",
      validatorFn: validate,
    });
    expect(input).toEqual({ title: "Hello" });
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

  test.each([MARKDOWN_FIELD_NAME, STATS_FIELD_NAME, TOC_FIELD_NAME])(
    "rejects a frontmatter %s field instead of overwriting it",
    (field) => {
      expect(() =>
        parseMarkdownFile({
          schema: z.object({}),
          data: `---\n${field}: from-frontmatter\n---\n# Body`,
          filePath: "/fixtures/override.md",
          validatorFn: validate,
        }),
      ).toThrow(
        `/fixtures/override.md: fields reserved for qino cannot appear in content or schema output: ${field}.`,
      );
    },
  );

  test.each([MARKDOWN_FIELD_NAME, STATS_FIELD_NAME, TOC_FIELD_NAME])(
    "rejects %s added by a schema transform",
    (field) => {
      expect(() =>
        parseMarkdownFile({
          schema: z.object({}).transform(() => ({ [field]: "conflict" })),
          data: "# Body",
          filePath: "/fixtures/transform.md",
          validatorFn: validate,
        }),
      ).toThrow(
        `/fixtures/transform.md: fields reserved for qino cannot appear in content or schema output: ${field}.`,
      );
    },
  );

  test("reads a frontmatter raw field as an ordinary field", () => {
    expect(
      parseMarkdownFile({
        schema: z.object({ raw: z.string() }),
        data: "---\nraw: from-frontmatter\n---\n# Body",
        filePath: "/fixtures/post.md",
        validatorFn: validate,
      }),
    ).toEqual({ raw: "from-frontmatter", markdown: "# Body" });
  });

  test("adds empty markdown when the document only has frontmatter", () => {
    const data = "---\ntitle: Hello\n---\n";
    expect(
      parseMarkdownFile({
        schema: z.object({ title: z.string() }),
        data,
        filePath: "/fixtures/empty.md",
        validatorFn: validate,
      }),
    ).toEqual({ title: "Hello", markdown: "" });
  });

  test.each([".md", ".mdx", ".markdown"])(
    "accepts an empty schema for %s files without frontmatter",
    (extension) => {
      expect(
        parseMarkdownFile({
          schema: z.object({}),
          data: "just the markdown",
          filePath: `/fixtures/plain${extension}`,
          validatorFn: validate,
        }),
      ).toEqual({ markdown: "just the markdown" });
    },
  );

  test("hints when an erased schema still requires markdown", () => {
    const schema: StandardSchemaV1<unknown, { title: string }> = z.object({
      title: z.string(),
      markdown: z.string(),
    });
    expect(() =>
      parseMarkdownFile({
        schema,
        data: "---\ntitle: Hello\n---\n# Body",
        filePath: "/fixtures/post.md",
        validatorFn: validate,
      }),
    ).toThrow(
      "Validation failed for /fixtures/post.md:\n  markdown: Invalid input: expected string, received undefined\nFields added by qino after validation cannot be declared in the schema: markdown.",
    );
  });

  test("propagates validation errors with the supplied filePath", () => {
    const raw = ["---", "title: 42", "---", "markdown"].join("\n");
    expect(() =>
      parseMarkdownFile({
        schema: z.object({ title: z.string() }),
        data: raw,
        filePath: "/fixtures/bad.md",
        validatorFn: validate,
      }),
    ).toThrow(/\/fixtures\/bad\.md.*title/s);
  });
});
