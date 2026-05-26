import { describe, expect, test } from "vitest";
import { z } from "zod";

import { parseMarkdownFile } from "./parse-markdown-file";

describe("parseMarkdownFile", () => {
  test("exposes the body under the `markdown` field and merges frontmatter", () => {
    const schema = z.object({
      title: z.string(),
      markdown: z.string(),
    });
    const raw = ["---", "title: Hello", "---", "", "# Body"].join("\n");
    const result = parseMarkdownFile({
      schema,
      raw,
      filePath: "/fixtures/post.md",
    });
    expect(result.title).toBe("Hello");
    expect(result.markdown.trim()).toBe("# Body");
  });

  test("body overrides a frontmatter `markdown` key (spread order)", () => {
    const schema = z.object({ markdown: z.string() });
    const raw = ["---", "markdown: from-frontmatter", "---", "body here"].join(
      "\n",
    );
    const result = parseMarkdownFile({
      schema,
      raw,
      filePath: "/fixtures/override.md",
    });
    expect(result.markdown.trim()).toBe("body here");
  });

  test("handles raw with no frontmatter (only body is exposed)", () => {
    const schema = z.object({ markdown: z.string() });
    const result = parseMarkdownFile({
      schema,
      raw: "just the body",
      filePath: "/fixtures/plain.md",
    });
    expect(result.markdown).toBe("just the body");
  });

  test("propagates validation errors with the supplied filePath", () => {
    const schema = z.object({ title: z.string(), markdown: z.string() });
    const raw = ["---", "title: 42", "---", "body"].join("\n");
    expect(() =>
      parseMarkdownFile({
        schema,
        raw,
        filePath: "/fixtures/bad.md",
      }),
    ).toThrow(/\/fixtures\/bad\.md.*title/s);
  });
});
