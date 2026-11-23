import { describe, expect, test } from "vitest";

import { requirePages } from "./require-pages";

describe("requirePages", () => {
  test("returns what was resolved", () => {
    const resolved = { page: "/about", siteUrl: "https://example.com" };

    expect(
      requirePages(resolved, { owner: 'Item "about.md"', option: "page" }),
    ).toBe(resolved);
  });

  test("names the option a primitive is missing", () => {
    expect(() =>
      requirePages(undefined, { owner: 'Tree "docs"', option: "pages" }),
    ).toThrow(
      'Tree "docs" has no pages: declare them to get page Markdown and Markdown URLs.',
    );
    expect(() =>
      requirePages(undefined, { owner: 'Item "about.md"', option: "page" }),
    ).toThrow(
      'Item "about.md" has no page: declare it to get page Markdown and a Markdown URL.',
    );
  });
});
