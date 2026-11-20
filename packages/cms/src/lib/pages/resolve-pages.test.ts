import { describe, expect, test } from "vitest";

import { resolvePages } from "./resolve-pages";

const owner = 'Collection "posts"';
const siteUrl = "https://example.com";
const pages = { index: "/blog", entry: "/blog/{slug}", title: "Blog" } as const;

describe("resolvePages", () => {
  test("returns the pages with their siteUrl", () => {
    expect(resolvePages({ pages, siteUrl, owner })).toEqual({
      ...pages,
      siteUrl,
    });
  });

  test("puts the title on one line", () => {
    expect(
      resolvePages({
        pages: { ...pages, title: " The\n blog " },
        siteUrl,
        owner,
      })?.title,
    ).toBe("The blog");
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
        pages: { ...pages, entry: "/blog" } as never,
        siteUrl,
        owner,
      }),
    ).toThrow(
      'Collection "posts": pages.entry "/blog" must contain {slug} once.',
    );
  });

  test.each([
    { ...pages, title: undefined },
    { ...pages, title: " " },
  ])("needs a title, which %j lacks", (untitled) => {
    expect(() =>
      resolvePages({ pages: untitled as never, siteUrl, owner }),
    ).toThrow(
      'Collection "posts": pages.title must name the index page, such as "Blog".',
    );
  });
});
