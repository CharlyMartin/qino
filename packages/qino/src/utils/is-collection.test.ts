import { describe, expect, test } from "vitest";

import { makeDummyCollection } from "../test-utils/make-dummy-collection";
import { makeDummyItem } from "../test-utils/make-dummy-item";
import { makeDummyTree } from "../test-utils/make-dummy-tree";
import { isCollection } from "./is-collection";

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
