import { describe, expect, test } from "vitest";

import { resolvePages } from "./resolve-pages";

const owner = 'Collection "posts"';
const pages = { index: "/blog", entry: "/blog/{slug}" } as const;

describe("resolvePages", () => {
  test("returns the pages with their siteUrl", () => {
    expect(
      resolvePages({ pages, siteUrl: "https://example.com", owner }),
    ).toEqual({ ...pages, siteUrl: "https://example.com" });
  });

  test("is undefined without pages", () => {
    expect(
      resolvePages({ pages: undefined, siteUrl: undefined, owner }),
    ).toBeUndefined();
  });

  test("needs a siteUrl", () => {
    expect(() => resolvePages({ pages, siteUrl: undefined, owner })).toThrow(
      'Collection "posts" declares pages, so initQino needs a siteUrl, such as "https://example.com".',
    );
  });

  test("names the primitive and the bad path", () => {
    expect(() =>
      resolvePages({
        // As a JavaScript caller could pass it.
        pages: { index: "/blog", entry: "/blog" } as never,
        siteUrl: "https://example.com",
        owner,
      }),
    ).toThrow(
      'Collection "posts": pages.entry "/blog" must contain {slug} once.',
    );
  });
});
