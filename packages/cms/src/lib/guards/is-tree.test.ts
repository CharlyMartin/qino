import { describe, expect, test } from "vitest";

import { makeDummyCollection } from "../../test-utils/make-dummy-collection";
import { makeDummyItem } from "../../test-utils/make-dummy-item";
import { makeDummyTree } from "../../test-utils/make-dummy-tree";
import { isTree } from "./is-tree";

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
