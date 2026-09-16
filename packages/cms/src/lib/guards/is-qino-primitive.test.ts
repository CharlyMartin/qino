import { describe, expect, test } from "vitest";

import { makeDummyCollection } from "../../test-utils/make-dummy-collection";
import { makeDummyItem } from "../../test-utils/make-dummy-item";
import { makeDummyQino } from "../../test-utils/make-dummy-qino";
import { makeDummyTree } from "../../test-utils/make-dummy-tree";
import { isQinoPrimitive } from "./is-qino-primitive";

describe("isQinoPrimitive", () => {
  test("returns true for a collection", () => {
    expect(
      isQinoPrimitive(
        makeDummyCollection({ directory: "/posts", extension: ".md" }),
      ),
    ).toBe(true);
  });

  test("returns true for an item", () => {
    expect(isQinoPrimitive(makeDummyItem({ file: "/config.json" }))).toBe(true);
  });

  test("returns true for a tree", () => {
    expect(
      isQinoPrimitive(makeDummyTree({ directory: "/docs", extension: ".md" })),
    ).toBe(true);
  });

  test("returns false for a Qino instance", () => {
    expect(isQinoPrimitive(makeDummyQino())).toBe(false);
  });

  test("returns false for null", () => {
    expect(isQinoPrimitive(null)).toBe(false);
  });

  test("returns false for a plain object", () => {
    expect(isQinoPrimitive({})).toBe(false);
  });
});
