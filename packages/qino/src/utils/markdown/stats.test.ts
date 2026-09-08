import { describe, expect, test } from "vitest";

import { stats } from "./stats";

describe("markdown.stats", () => {
  test("counts readable prose while excluding syntax, URLs, images, and code", () => {
    const body = [
      "# Hello **world**",
      "",
      "Read [the guide](https://example.com/guide).",
      "",
      "`const ignored = true`",
      "",
      "```ts",
      "const alsoIgnored = true;",
      "```",
      "",
      "![Ignored image description](https://example.com/image.png)",
    ].join("\n");

    expect(stats(body)).toEqual({
      wordCount: 5,
      proseCharacterCount: 27,
      sourceCharacterCount: Array.from(body).length,
    });
  });

  test("supports GFM tables and excludes MDX expressions and components", () => {
    const body = [
      "| Name |",
      "| --- |",
      "| Ada |",
      "",
      "<Callout>Ignored component content</Callout>",
      "",
      "{ignoredExpression}",
    ].join("\n");

    expect(stats(body).wordCount).toBe(2);
  });

  test("counts Unicode graphemes instead of UTF-16 code units", () => {
    expect(stats("é 👋")).toEqual({
      wordCount: 1,
      proseCharacterCount: 3,
      sourceCharacterCount: 3,
    });
  });
});
