import { describe, expect, test } from "vitest";

import { toListingLink } from "./to-listing-link";

const url = "https://example.com/blog/hello.md";

describe("toListingLink", () => {
  test("puts the title and description on one line each", () => {
    expect(
      toListingLink({
        entry: { title: "Hello\nthere", description: "Two\n\nlines.\n" },
        fallbackTitle: "hello",
        url,
      }),
    ).toEqual({ title: "Hello there", url, description: "Two lines." });
  });

  test("falls back for the title, and leaves the description empty", () => {
    expect(toListingLink({ entry: {}, fallbackTitle: "hello", url })).toEqual({
      title: "hello",
      url,
      description: "",
    });
  });
});
