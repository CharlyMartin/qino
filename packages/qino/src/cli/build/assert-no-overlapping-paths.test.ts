import { describe, expect, test } from "vitest";

import { assertNoOverlappingPaths } from "./assert-no-overlapping-paths";

describe("assertNoOverlappingPaths", () => {
  test("passes when paths are disjoint", () => {
    expect(() =>
      assertNoOverlappingPaths({
        collectionDirs: ["/authors"],
        singletonFiles: ["/pages/home.md"],
        treeDirs: ["/docs"],
      }),
    ).not.toThrow();
  });

  test("throws when one tree directory is a prefix of another", () => {
    expect(() =>
      assertNoOverlappingPaths({
        collectionDirs: [],
        singletonFiles: [],
        treeDirs: ["/docs", "/docs/api"],
      }),
    ).toThrow(/Tree directories overlap.*\/docs.*\/docs\/api/);
  });

  test("throws when a tree directory is a prefix of a collection directory", () => {
    expect(() =>
      assertNoOverlappingPaths({
        collectionDirs: ["/docs/api"],
        singletonFiles: [],
        treeDirs: ["/docs"],
      }),
    ).toThrow(/Tree directory "\/docs" overlaps with collection/);
  });

  test("throws when a collection directory equals a tree directory", () => {
    expect(() =>
      assertNoOverlappingPaths({
        collectionDirs: ["/docs"],
        singletonFiles: [],
        treeDirs: ["/docs"],
      }),
    ).toThrow(/overlaps with collection/);
  });

  test("throws when a singleton file sits inside a tree directory", () => {
    expect(() =>
      assertNoOverlappingPaths({
        collectionDirs: [],
        singletonFiles: ["/docs/preamble.md"],
        treeDirs: ["/docs"],
      }),
    ).toThrow(
      /Singleton file "\/docs\/preamble\.md" sits inside tree directory "\/docs"/,
    );
  });

  test("allows a singleton path that shares a prefix but is not inside the tree", () => {
    expect(() =>
      assertNoOverlappingPaths({
        collectionDirs: [],
        singletonFiles: ["/docs-extra.md"],
        treeDirs: ["/docs"],
      }),
    ).not.toThrow();
  });
});
