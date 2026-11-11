import { describe, expect, test } from "vitest";

import { resolveMarkdownConfig } from "./resolve-markdown-config";

const webp = { accepted: "image/webp", maxSize: "1MB" } as const;
const png = { accepted: "image/png", maxSize: "1MB" } as const;

function resolve(markdown: unknown, extension = ".md") {
  return resolveMarkdownConfig({
    markdown: markdown as never,
    extension,
    primitiveId: "posts",
  });
}

describe("resolveMarkdownConfig", () => {
  test("defaults everything off", () => {
    expect(resolve(undefined)).toEqual({ stats: false, toc: false, media: [] });
    expect(resolve({})).toEqual({ stats: false, toc: false, media: [] });
  });

  test.each([".md", ".mdx", ".markdown"])("accepts %s files", (extension) => {
    expect(resolve({ stats: true, toc: true }, extension)).toEqual({
      stats: true,
      toc: true,
      media: [],
    });
  });

  test("accepts JSON files without markdown", () => {
    expect(resolve(undefined, ".json")).toEqual({
      stats: false,
      toc: false,
      media: [],
    });
  });

  test("rejects markdown on JSON files", () => {
    expect(() => resolve({ stats: false }, ".json")).toThrow(
      'markdown of "posts" configures the Markdown body, but JSON files have none.',
    );
  });

  test("rejects a markdown that isn't an object", () => {
    expect(() => resolve(true)).toThrow(
      'markdown of "posts" must be an object, got boolean.',
    );
  });

  test("lists one media rule", () => {
    expect(resolve({ media: webp }).media).toEqual([webp]);
    expect(resolve({ media: [webp, png] }).media).toEqual([webp, png]);
  });

  test("rejects a parse that isn't a function", () => {
    expect(() => resolve({ media: { ...webp, parse: "wiki" } })).toThrow(
      'markdown.media.parse of "posts" must be a function, got string.',
    );
    expect(() => resolve({ media: [webp, { ...png, parse: 1 }] })).toThrow(
      'markdown.media, rule 2, parse of "posts" must be a function, got number.',
    );
  });

  test("accepts toc options", () => {
    const slug = (text: string) => text;
    expect(resolve({ toc: { upTo: "h3", slug } }).toc).toEqual({
      upTo: "h3",
      slug,
    });
    expect(resolve({ toc: { slug } }).toc).toEqual({ slug });
  });

  test("rejects a slug that isn't a function", () => {
    expect(() => resolve({ toc: { slug: "kebab" } })).toThrow(
      'markdown.toc.slug of "posts" must be a function, got string.',
    );
  });

  test("rejects an upTo that isn't a heading tag", () => {
    expect(() => resolve({ toc: { upTo: "h7" } })).toThrow(
      'markdown.toc.upTo of "posts" must be one of h1, h2, h3, h4, h5, h6, got "h7".',
    );
  });
});
