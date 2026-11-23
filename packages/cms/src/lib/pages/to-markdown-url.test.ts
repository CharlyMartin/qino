import { describe, expect, test } from "vitest";

import { toMarkdownUrl } from "./to-markdown-url";

const origin = "https://example.com";

describe("toMarkdownUrl", () => {
  test.each([
    ["/blog/hello", "https://example.com/blog/hello.md"],
    ["/blog/hello/", "https://example.com/blog/hello.md"],
    ["/", "https://example.com/index.md"],
  ])("gives %j the Markdown URL %j", (path, url) => {
    expect(toMarkdownUrl(path, origin)).toBe(url);
  });

  test.each(["//evil.com", "/\\evil.com", "/\t/evil.com"])(
    "keeps %j on the site, whatever the path holds",
    (path) => {
      expect(new URL(toMarkdownUrl(path, origin)).origin).toBe(origin);
    },
  );
});
