import { describe, expect, test } from "vitest";

import { readEntryDescription } from "./read-entry-description";

const ORIGIN = "https://example.com";

describe("readEntryDescription", () => {
  test("trims the description and gives it LF line endings", () => {
    expect(
      readEntryDescription({ description: "Two\r\nlines.\n" }, ORIGIN),
    ).toBe("Two\nlines.");
  });

  test("makes its site-relative links absolute on the origin", () => {
    expect(
      readEntryDescription({ description: "See [setup](/setup)." }, ORIGIN),
    ).toBe("See [setup](https://example.com/setup).");
  });

  test.each([{}, { description: 42 }])(
    "is empty when the entry %j has no description",
    (entry) => {
      expect(readEntryDescription(entry, ORIGIN)).toBe("");
    },
  );
});
