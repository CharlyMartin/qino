import { describe, expect, test } from "vitest";

import { isQinoPrimitive } from "./is-qino-primitive";
import {
  makeDummyCollection,
  makeDummyQino,
  makeDummySingleton,
  makeDummyTree,
} from "./tests";

describe("isQinoPrimitive", () => {
  test("returns true for a collection", () => {
    expect(
      isQinoPrimitive(
        makeDummyCollection({ directory: "/posts", extension: ".md" }),
      ),
    ).toBe(true);
  });

  test("returns true for a singleton", () => {
    expect(isQinoPrimitive(makeDummySingleton({ file: "/config.json" }))).toBe(
      true,
    );
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
