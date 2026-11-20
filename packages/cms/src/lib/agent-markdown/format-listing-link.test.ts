import { describe, expect, test } from "vitest";

import { formatListingLink } from "./format-listing-link";

const url = "https://example.com/blog/hello.md";

describe("formatListingLink", () => {
  test("links the title, then the description", () => {
    expect(formatListingLink({ title: "Hello", url, description: "Hi." })).toBe(
      "- [Hello](https://example.com/blog/hello.md): Hi.",
    );
  });

  test("leaves out an empty description", () => {
    expect(formatListingLink({ title: "Hello", url, description: "" })).toBe(
      "- [Hello](https://example.com/blog/hello.md)",
    );
  });

  test("escapes brackets and backslashes in the title", () => {
    expect(formatListingLink({ title: "a\\b [c", url, description: "" })).toBe(
      "- [a\\\\b \\[c](https://example.com/blog/hello.md)",
    );
  });
});
