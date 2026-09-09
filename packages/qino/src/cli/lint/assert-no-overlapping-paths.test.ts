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

  test("passes for empty inputs", () => {
    expect(() =>
      assertNoOverlappingPaths({
        collectionDirs: [],
        singletonFiles: [],
        treeDirs: [],
      }),
    ).not.toThrow();
  });

  test("throws when two collection directories overlap", () => {
    expect(() =>
      assertNoOverlappingPaths({
        collectionDirs: ["/posts", "/posts/featured"],
        singletonFiles: [],
        treeDirs: [],
      }),
    ).toThrow(/Collection directories overlap.*\/posts.*\/posts\/featured/);
  });

  test("throws when two collection directories are equal", () => {
    expect(() =>
      assertNoOverlappingPaths({
        collectionDirs: ["/posts", "/posts"],
        singletonFiles: [],
        treeDirs: [],
      }),
    ).toThrow(/Collection directories overlap/);
  });

  test("throws when two tree directories are equal", () => {
    expect(() =>
      assertNoOverlappingPaths({
        collectionDirs: [],
        singletonFiles: [],
        treeDirs: ["/docs", "/docs"],
      }),
    ).toThrow(/Tree directories overlap/);
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

  test("throws when two singletons target the same file", () => {
    expect(() =>
      assertNoOverlappingPaths({
        collectionDirs: [],
        singletonFiles: ["/settings.json", "/settings.json"],
        treeDirs: [],
      }),
    ).toThrow(/Two singletons target the same file.*\/settings\.json/);
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

  test("throws when a singleton file sits inside a collection directory", () => {
    expect(() =>
      assertNoOverlappingPaths({
        collectionDirs: ["/posts"],
        singletonFiles: ["/posts/intro.md"],
        treeDirs: [],
      }),
    ).toThrow(
      /Singleton file "\/posts\/intro\.md" sits inside collection directory "\/posts"/,
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
