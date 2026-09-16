import { describe, expect, test } from "vitest";

import { makeDummyCollection } from "../../test-utils/make-dummy-collection";
import { makeDummyItem } from "../../test-utils/make-dummy-item";
import { makeDummyTree } from "../../test-utils/make-dummy-tree";
import { isItem } from "./is-item";

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
