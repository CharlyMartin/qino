import { describe, expect, test } from "vitest";

import { assertMarkdownStatsConfig } from "./assert-markdown-stats-config";

describe("assertMarkdownStatsConfig", () => {
  test.each([".md", ".mdx", ".markdown"])("accepts %s files", (extension) => {
    expect(() =>
      assertMarkdownStatsConfig({
        markdownStats: true,
        extension,
        primitiveId: "posts",
      }),
    ).not.toThrow();
  });

  test("rejects JSON files", () => {
    expect(() =>
      assertMarkdownStatsConfig({
        markdownStats: true,
        extension: ".json",
        primitiveId: "authors",
      }),
    ).toThrow(
      'markdownStats of "authors" counts the Markdown body, but JSON files have none.',
    );
  });

  test("accepts JSON files when off", () => {
    expect(() =>
      assertMarkdownStatsConfig({
        markdownStats: false,
        extension: ".json",
        primitiveId: "authors",
      }),
    ).not.toThrow();
  });
});
