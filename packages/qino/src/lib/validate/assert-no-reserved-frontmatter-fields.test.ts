import { describe, expect, test } from "vitest";

import { assertNoReservedFrontmatterFields } from "./assert-no-reserved-frontmatter-fields";

describe("assertNoReservedFrontmatterFields", () => {
  test.each([
    ".md",
    ".mdx",
    ".markdown",
  ])("rejects both reserved fields in %s", (ext) => {
    const filePath = `/entry${ext}`;
    expect(() =>
      assertNoReservedFrontmatterFields(
        { _meta: undefined, markdown: "override" },
        filePath,
      ),
    ).toThrow(
      `${filePath}: fields reserved for Qino cannot appear in content or schema output: _meta, markdown.`,
    );
  });

  test.each([
    "_meta",
    "markdown",
  ])("checks own %s properties, including non-enumerable ones", (key) => {
    expect(() =>
      assertNoReservedFrontmatterFields({ [key]: undefined }, "/entry.md"),
    ).toThrow(key);
    expect(() =>
      assertNoReservedFrontmatterFields(
        Object.defineProperty({}, key, { value: undefined }),
        "/entry.md",
      ),
    ).toThrow(key);
    expect(() =>
      assertNoReservedFrontmatterFields(
        Object.create({ [key]: "inherited" }),
        "/entry.md",
      ),
    ).not.toThrow();
  });

  test("allows nested reserved names", () => {
    expect(() =>
      assertNoReservedFrontmatterFields(
        { nested: { _meta: {}, markdown: 42 } },
        "/entry.md",
      ),
    ).not.toThrow();
  });

  test.each([
    null,
    undefined,
    "text",
    42,
    true,
  ])("ignores non-object input %s", (data) => {
    expect(() =>
      assertNoReservedFrontmatterFields(data, "/entry.md"),
    ).not.toThrow();
  });
});
