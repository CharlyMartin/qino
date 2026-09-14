import { describe, expect, test } from "vitest";

import { isItem } from "./is-item";
import { makeDummyCollection, makeDummyItem, makeDummyTree } from "./tests";

describe("isItem", () => {
  test("returns true for an item", () => {
    expect(isItem(makeDummyItem({ file: "/config.json" }))).toBe(true);
  });

  test("returns false for a tree", () => {
    expect(
      isItem(makeDummyTree({ directory: "/docs", extension: ".md" })),
    ).toBe(false);
  });

  test("returns false for a collection", () => {
    expect(
      isItem(makeDummyCollection({ directory: "/posts", extension: ".md" })),
    ).toBe(false);
  });
});
