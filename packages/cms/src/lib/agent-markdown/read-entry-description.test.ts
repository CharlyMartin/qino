import { describe, expect, test } from "vitest";

import { readEntryDescription } from "./read-entry-description";

describe("readEntryDescription", () => {
  test("trims the description and gives it LF line endings", () => {
    expect(readEntryDescription({ description: "Two\r\nlines.\n" })).toBe(
      "Two\nlines.",
    );
  });

  test.each([{}, { description: 42 }])(
    "is empty when the entry %j has no description",
    (entry) => {
      expect(readEntryDescription(entry)).toBe("");
    },
  );
});
