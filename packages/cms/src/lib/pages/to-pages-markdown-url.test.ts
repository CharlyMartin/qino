import { describe, expect, test } from "vitest";

import { toPagesMarkdownUrl } from "./to-pages-markdown-url";

const pages = {
  index: "/docs",
  entry: "/docs/{slug}",
  siteUrl: "https://example.com",
} as const;

describe("toPagesMarkdownUrl", () => {
  test("is the entry page's for a slug", () => {
    expect(toPagesMarkdownUrl(pages, "guide/cli")).toBe(
      "https://example.com/docs/guide/cli.md",
    );
  });

  test("is the index page's without one", () => {
    expect(toPagesMarkdownUrl(pages)).toBe("https://example.com/docs.md");
  });
});
