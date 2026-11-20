import { describe, expect, test } from "vitest";

import { readEntryTitle } from "./read-entry-title";

describe("readEntryTitle", () => {
  test("reads the title field, on one line", () => {
    expect(
      readEntryTitle({
        entry: { title: " Hello\n world " },
        fallbackTitle: "x",
      }),
    ).toBe("Hello world");
  });

  test("reads another field when told to", () => {
    expect(
      readEntryTitle({
        entry: { label: "CLI" },
        titleField: "label",
        fallbackTitle: "x",
      }),
    ).toBe("CLI");
  });

  test.each([{}, { title: " " }, { title: 42 }])(
    "falls back when the entry %j has no title",
    (entry) => {
      expect(readEntryTitle({ entry, fallbackTitle: "hello" })).toBe("hello");
    },
  );
});
