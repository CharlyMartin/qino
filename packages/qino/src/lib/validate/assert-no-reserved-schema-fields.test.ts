import { describe, expect, test } from "vitest";

import { assertNoReservedSchemaFields } from "./assert-no-reserved-schema-fields";

describe("assertNoReservedSchemaFields", () => {
  test.each([
    ".json",
    ".md",
    ".mdx",
    ".markdown",
  ])("reserves _meta in %s", (ext) => {
    const filePath = `/content/entry${ext}`;
    expect(() =>
      assertNoReservedSchemaFields({ _meta: undefined }, filePath),
    ).toThrow(
      `${filePath}: fields reserved for Qino cannot appear in content or schema output: _meta.`,
    );
  });

  test.each([
    ".json",
    ".md",
    ".mdx",
    ".markdown",
  ])("allows markdown and nested reserved names in %s", (ext) => {
    expect(() =>
      assertNoReservedSchemaFields({ markdown: 42 }, `/entry${ext}`),
    ).not.toThrow();
    expect(() =>
      assertNoReservedSchemaFields(
        { nested: { _meta: {}, markdown: 42 } },
        "/entry.md",
      ),
    ).not.toThrow();
  });

  test("checks own properties, including non-enumerable ones", () => {
    expect(() =>
      assertNoReservedSchemaFields(Object.create({ _meta: {} }), "/entry.md"),
    ).not.toThrow();
    expect(() =>
      assertNoReservedSchemaFields(
        Object.defineProperty({}, "_meta", { value: {} }),
        "/entry.md",
      ),
    ).toThrow("_meta");
  });
  test.each([
    null,
    undefined,
    "text",
    42,
    true,
  ])("ignores non-object input %s", (data) => {
    expect(() => assertNoReservedSchemaFields(data, "/entry.md")).not.toThrow();
  });
});
