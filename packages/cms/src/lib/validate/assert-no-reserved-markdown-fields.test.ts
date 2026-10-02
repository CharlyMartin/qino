import { describe, expect, test } from "vitest";

import { assertNoReservedMarkdownFields } from "./assert-no-reserved-markdown-fields";

describe("assertNoReservedMarkdownFields", () => {
  test.each([".md", ".mdx", ".markdown"])(
    "rejects all reserved fields in %s",
    (ext) => {
      const filePath = `/entry${ext}`;
      expect(() =>
        assertNoReservedMarkdownFields(
          { _meta: undefined, markdown: "override", raw: "override" },
          filePath,
        ),
      ).toThrow(
        `${filePath}: fields reserved for Qino cannot appear in content or schema output: _meta, markdown, raw.`,
      );
    },
  );

  test.each(["_meta", "markdown", "raw"])(
    "checks own %s properties, including non-enumerable ones",
    (key) => {
      expect(() =>
        assertNoReservedMarkdownFields({ [key]: undefined }, "/entry.md"),
      ).toThrow(key);
      expect(() =>
        assertNoReservedMarkdownFields(
          Object.defineProperty({}, key, { value: undefined }),
          "/entry.md",
        ),
      ).toThrow(key);
      expect(() =>
        assertNoReservedMarkdownFields(
          Object.create({ [key]: "inherited" }),
          "/entry.md",
        ),
      ).not.toThrow();
    },
  );

  test("allows nested reserved names", () => {
    expect(() =>
      assertNoReservedMarkdownFields(
        { nested: { _meta: {}, markdown: 42, raw: 42 } },
        "/entry.md",
      ),
    ).not.toThrow();
  });

  test.each([null, undefined, "text", 42, true])(
    "ignores non-object input %s",
    (data) => {
      expect(() =>
        assertNoReservedMarkdownFields(data, "/entry.md"),
      ).not.toThrow();
    },
  );
});
