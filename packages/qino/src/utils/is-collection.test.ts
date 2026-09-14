import { describe, expect, test } from "vitest";

import { isCollection } from "./is-collection";
import { makeDummyCollection, makeDummyItem, makeDummyTree } from "./tests";

describe("isCollection", () => {
  test("returns true for a collection", () => {
    expect(
      isCollection(
        makeDummyCollection({ directory: "/posts", extension: ".md" }),
      ),
    ).toBe(true);
  });

  test("returns false for a tree", () => {
    expect(
      isCollection(makeDummyTree({ directory: "/docs", extension: ".md" })),
    ).toBe(false);
  });

  test("returns false for an item", () => {
    expect(isCollection(makeDummyItem({ file: "/config.json" }))).toBe(false);
  });
});
