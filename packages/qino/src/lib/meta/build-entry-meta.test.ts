import { describe, expect, test } from "vitest";

import { buildEntryMeta } from "./build-entry-meta";

describe("buildEntryMeta", () => {
  test("returns slug, fileName, and filePath for a .md file", () => {
    expect(
      buildEntryMeta({
        directory: "/posts",
        relativePath: "hello.md",
        extension: ".md",
      }),
    ).toEqual({
      slug: "hello",
      fileName: "hello.md",
      filePath: "/posts/hello.md",
    });
  });

  test("works with .mdx", () => {
    expect(
      buildEntryMeta({
        directory: "/posts",
        relativePath: "hello.mdx",
        extension: ".mdx",
      }),
    ).toEqual({
      slug: "hello",
      fileName: "hello.mdx",
      filePath: "/posts/hello.mdx",
    });
  });

  test("works with .json", () => {
    expect(
      buildEntryMeta({
        directory: "/data",
        relativePath: "config.json",
        extension: ".json",
      }),
    ).toEqual({
      slug: "config",
      fileName: "config.json",
      filePath: "/data/config.json",
    });
  });

  test("works with .markdown", () => {
    expect(
      buildEntryMeta({
        directory: "/posts",
        relativePath: "hello.markdown",
        extension: ".markdown",
      }),
    ).toEqual({
      slug: "hello",
      fileName: "hello.markdown",
      filePath: "/posts/hello.markdown",
    });
  });

  test("throws when relativePath does not end with extension", () => {
    expect(() =>
      buildEntryMeta({
        directory: "/posts",
        relativePath: "hello.mdx",
        extension: ".md",
      }),
    ).toThrow(/hello\.mdx.*\.md/);
  });

  test("throws when relativePath has no extension at all", () => {
    expect(() =>
      buildEntryMeta({
        directory: "/posts",
        relativePath: "hello",
        extension: ".md",
      }),
    ).toThrow(/hello/);
  });

  test("strips subdirectories in relativePath (uses basename only)", () => {
    expect(
      buildEntryMeta({
        directory: "/posts",
        relativePath: "nested/sub/hello.md",
        extension: ".md",
      }),
    ).toEqual({
      slug: "hello",
      fileName: "hello.md",
      filePath: "/posts/hello.md",
    });
  });

  test("normalizes a directory with a trailing slash", () => {
    expect(
      buildEntryMeta({
        directory: "/posts/",
        relativePath: "hello.md",
        extension: ".md",
      }),
    ).toEqual({
      slug: "hello",
      fileName: "hello.md",
      filePath: "/posts/hello.md",
    });
  });

  test("slug strips only the final extension", () => {
    expect(
      buildEntryMeta({
        directory: "/posts",
        relativePath: "post.draft.md",
        extension: ".md",
      }),
    ).toEqual({
      slug: "post.draft",
      fileName: "post.draft.md",
      filePath: "/posts/post.draft.md",
    });
  });
});
