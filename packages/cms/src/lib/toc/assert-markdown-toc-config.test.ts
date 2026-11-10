import { describe, expect, test } from "vitest";

import { assertMarkdownTocConfig } from "./assert-markdown-toc-config";

describe("assertMarkdownTocConfig", () => {
  test.each([".md", ".mdx", ".markdown"])("accepts %s files", (extension) => {
    expect(() =>
      assertMarkdownTocConfig({
        markdownToc: true,
        extension,
        primitiveId: "posts",
      }),
    ).not.toThrow();
  });

  test("accepts upTo", () => {
    expect(() =>
      assertMarkdownTocConfig({
        markdownToc: { upTo: "h3" },
        extension: ".md",
        primitiveId: "posts",
      }),
    ).not.toThrow();
  });

  test("rejects JSON files", () => {
    expect(() =>
      assertMarkdownTocConfig({
        markdownToc: { upTo: "h2" },
        extension: ".json",
        primitiveId: "authors",
      }),
    ).toThrow(
      'markdownToc of "authors" lists the Markdown headings, but JSON files have none.',
    );
  });

  test("accepts JSON files when off", () => {
    expect(() =>
      assertMarkdownTocConfig({
        markdownToc: false,
        extension: ".json",
        primitiveId: "authors",
      }),
    ).not.toThrow();
  });

  test("accepts slug without upTo", () => {
    expect(() =>
      assertMarkdownTocConfig({
        markdownToc: { slug: (text) => text },
        extension: ".md",
        primitiveId: "posts",
      }),
    ).not.toThrow();
  });

  test("rejects a slug that isn't a function", () => {
    expect(() =>
      assertMarkdownTocConfig({
        markdownToc: { slug: "kebab" as never },
        extension: ".md",
        primitiveId: "posts",
      }),
    ).toThrow('markdownToc.slug of "posts" must be a function, got string.');
  });

  test("rejects an upTo that isn't a heading tag", () => {
    expect(() =>
      assertMarkdownTocConfig({
        markdownToc: { upTo: "h7" as never },
        extension: ".md",
        primitiveId: "posts",
      }),
    ).toThrow(
      'markdownToc.upTo of "posts" must be one of h1, h2, h3, h4, h5, h6, got "h7".',
    );
  });
});
