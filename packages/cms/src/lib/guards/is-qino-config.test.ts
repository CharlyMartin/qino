import { describe, expect, test } from "vitest";

import { makeDummyCollection } from "../../test-utils/make-dummy-collection";
import { makeDummyItem } from "../../test-utils/make-dummy-item";
import { makeDummyQino } from "../../test-utils/make-dummy-qino";
import { makeDummyTree } from "../../test-utils/make-dummy-tree";
import { isQinoConfig } from "./is-qino-config";

describe("isQinoConfig", () => {
  test("returns true for a Qino instance", () => {
    expect(isQinoConfig(makeDummyQino())).toBe(true);
  });

  test("returns false for a collection", () => {
    expect(
      isQinoConfig(
        makeDummyCollection({ directory: "/posts", extension: ".md" }),
      ),
    ).toBe(false);
  });

  test("returns false for an item", () => {
    expect(isQinoConfig(makeDummyItem({ file: "/config.json" }))).toBe(false);
  });

  test("returns false for a tree", () => {
    expect(
      isQinoConfig(makeDummyTree({ directory: "/docs", extension: ".md" })),
    ).toBe(false);
  });

  test("returns false for null", () => {
    expect(isQinoConfig(null)).toBe(false);
  });

  test("returns false for a plain object", () => {
    expect(isQinoConfig({})).toBe(false);
  });
});
