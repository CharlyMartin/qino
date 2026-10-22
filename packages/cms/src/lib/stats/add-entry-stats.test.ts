import { describe, expect, test } from "vitest";

import { addEntryStats } from "./add-entry-stats";

describe("addEntryStats", () => {
  test("adds _stats from the markdown body", async () => {
    const entry = {
      title: "Hi",
      markdown: "Hello **world**\n\n```js\ncode\n```",
    };

    expect(await addEntryStats({ entry, markdownStats: true })).toEqual({
      ...entry,
      _stats: {
        wordCount: 2,
        proseCharacterCount: 11,
        sourceCharacterCount: 31,
      },
    });
  });

  test("returns the entry untouched when off", async () => {
    const entry = { title: "Hi", markdown: "Hello" };

    expect(await addEntryStats({ entry, markdownStats: false })).toBe(entry);
  });
});
