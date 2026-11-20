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

  test("percent-encodes parentheses in the URL", () => {
    expect(
      formatListingLink({
        title: "A",
        url: "https://example.com/blog/a).md",
        description: "",
      }),
    ).toBe("- [A](https://example.com/blog/a%29.md)");
  });

  test("escapes brackets and backslashes in the title", () => {
    expect(formatListingLink({ title: "a\\b [c", url, description: "" })).toBe(
      "- [a\\\\b \\[c](https://example.com/blog/hello.md)",
    );
  });
});
