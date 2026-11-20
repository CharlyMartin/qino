import { describe, expect, test } from "vitest";

import { resolvePages } from "./resolve-pages";

const owner = 'Collection "posts"';
const directory = "posts";
const pages = { index: "/blog", entry: "/blog/{slug}" } as const;

describe("resolvePages", () => {
  test("returns the pages with their siteUrl, titled after the directory", () => {
    expect(
      resolvePages({ pages, siteUrl: "https://example.com", owner, directory }),
    ).toEqual({ ...pages, title: "Posts", siteUrl: "https://example.com" });
  });

  test("keeps a given title, on one line", () => {
    expect(
      resolvePages({
        pages: { ...pages, title: " The\n blog " },
        siteUrl: "https://example.com",
        owner,
        directory,
      })?.title,
    ).toBe("The blog");
  });

  test("titles the index page after the directory when the title is blank", () => {
    expect(
      resolvePages({
        pages: { ...pages, title: " " },
        siteUrl: "https://example.com",
        owner,
        directory,
      })?.title,
    ).toBe("Posts");
  });

  test("is undefined without pages", () => {
    expect(
      resolvePages({ pages: undefined, siteUrl: undefined, owner, directory }),
    ).toBeUndefined();
  });

  test("needs a siteUrl", () => {
    expect(() =>
      resolvePages({ pages, siteUrl: undefined, owner, directory }),
    ).toThrow(
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
        directory,
      }),
    ).toThrow(
      'Collection "posts": pages.entry "/blog" must contain {slug} once.',
    );
  });
});
