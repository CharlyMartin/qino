import { describe, expect, test } from "vitest";

import { isTree } from "./is-tree";
import { makeDummyCollection, makeDummyItem, makeDummyTree } from "./tests";

describe("isTree", () => {
  test("returns true for a tree", () => {
    expect(
      isTree(makeDummyTree({ directory: "/docs", extension: ".md" })),
    ).toBe(true);
  });

  test("returns false for a collection", () => {
    expect(
      isTree(makeDummyCollection({ directory: "/posts", extension: ".md" })),
    ).toBe(false);
  });

  test("returns false for an item", () => {
    expect(isTree(makeDummyItem({ file: "/config.json" }))).toBe(false);
  });
});
