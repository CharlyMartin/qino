import { describe, expect, test } from "vitest";

import { isLocalMediaUrl } from "./is-local-media-url";

describe("isLocalMediaUrl", () => {
  test("accepts root-relative paths", () => {
    expect(isLocalMediaUrl("/images/a.png")).toBe(true);
  });

  test.each([
    "https://example.com/a.png",
    "//cdn.example.com/a.png",
    "data:image/png;base64,AAA",
    "mailto:a@b.c",
    "#anchor",
    "./a.png",
    "a.png",
    "",
  ])("rejects %s", (url) => {
    expect(isLocalMediaUrl(url)).toBe(false);
  });
});
