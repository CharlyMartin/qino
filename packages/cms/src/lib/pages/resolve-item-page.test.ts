import { describe, expect, test } from "vitest";

import { resolveItemPage } from "./resolve-item-page";

const owner = 'Item "about.md"';

describe("resolveItemPage", () => {
  test("returns the page with its siteUrl", () => {
    expect(
      resolveItemPage({
        page: "/about",
        siteUrl: "https://example.com",
        owner,
      }),
    ).toEqual({ page: "/about", siteUrl: "https://example.com" });
  });

  test("is undefined without a page", () => {
    expect(
      resolveItemPage({ page: undefined, siteUrl: undefined, owner }),
    ).toBeUndefined();
  });

  test("needs a siteUrl", () => {
    expect(() =>
      resolveItemPage({ page: "/about", siteUrl: undefined, owner }),
    ).toThrow(
      'Item "about.md" declares a page, so initQino needs a siteUrl, such as "https://example.com".',
    );
  });

  test("names the item and the bad path", () => {
    expect(() =>
      resolveItemPage({
        page: "//evil.com",
        siteUrl: "https://example.com",
        owner,
      }),
    ).toThrow('Item "about.md": page "//evil.com" must stay on the site.');
  });
});
