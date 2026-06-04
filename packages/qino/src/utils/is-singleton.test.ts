import { describe, expect, test } from "vitest";

import { isSingleton } from "./is-singleton";
import {
  makeDummyCollection,
  makeDummySingleton,
  makeDummyTree,
} from "./tests";

describe("isSingleton", () => {
  test("returns true for a singleton", () => {
    expect(isSingleton(makeDummySingleton({ file: "/config.json" }))).toBe(
      true,
    );
  });

  test("returns false for a tree", () => {
    expect(
      isSingleton(makeDummyTree({ directory: "/docs", extension: ".md" })),
    ).toBe(false);
  });

  test("returns false for a collection", () => {
    expect(
      isSingleton(
        makeDummyCollection({ directory: "/posts", extension: ".md" }),
      ),
    ).toBe(false);
  });
});
