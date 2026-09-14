import { describe, expect, test } from "vitest";

import { assertNoOverlappingPaths } from "./assert-no-overlapping-paths";

describe("assertNoOverlappingPaths", () => {
  test("passes when paths are disjoint", () => {
    expect(() =>
      assertNoOverlappingPaths({
        collectionDirs: ["/authors"],
        itemFiles: ["/pages/home.md"],
        treeDirs: ["/docs"],
      }),
    ).not.toThrow();
  });

  test("passes for empty inputs", () => {
    expect(() =>
      assertNoOverlappingPaths({
        collectionDirs: [],
        itemFiles: [],
        treeDirs: [],
      }),
    ).not.toThrow();
  });

  test("throws when two collection directories overlap", () => {
    expect(() =>
      assertNoOverlappingPaths({
        collectionDirs: ["/posts", "/posts/featured"],
        itemFiles: [],
        treeDirs: [],
      }),
    ).toThrow(/Collection directories overlap.*\/posts.*\/posts\/featured/);
  });

  test("throws when two collection directories are equal", () => {
    expect(() =>
      assertNoOverlappingPaths({
        collectionDirs: ["/posts", "/posts"],
        itemFiles: [],
        treeDirs: [],
      }),
    ).toThrow(/Collection directories overlap/);
  });

  test("throws when two tree directories are equal", () => {
    expect(() =>
      assertNoOverlappingPaths({
        collectionDirs: [],
        itemFiles: [],
        treeDirs: ["/docs", "/docs"],
      }),
    ).toThrow(/Tree directories overlap/);
  });

  test("throws when one tree directory is a prefix of another", () => {
    expect(() =>
      assertNoOverlappingPaths({
        collectionDirs: [],
        itemFiles: [],
        treeDirs: ["/docs", "/docs/api"],
      }),
    ).toThrow(/Tree directories overlap.*\/docs.*\/docs\/api/);
  });

  test("throws when two items target the same file", () => {
    expect(() =>
      assertNoOverlappingPaths({
        collectionDirs: [],
        itemFiles: ["/settings.json", "/settings.json"],
        treeDirs: [],
      }),
    ).toThrow(/Two items target the same file.*\/settings\.json/);
  });

  test("throws when a tree directory is a prefix of a collection directory", () => {
    expect(() =>
      assertNoOverlappingPaths({
        collectionDirs: ["/docs/api"],
        itemFiles: [],
        treeDirs: ["/docs"],
      }),
    ).toThrow(/Tree directory "\/docs" overlaps with collection/);
  });

  test("throws when a collection directory equals a tree directory", () => {
    expect(() =>
      assertNoOverlappingPaths({
        collectionDirs: ["/docs"],
        itemFiles: [],
        treeDirs: ["/docs"],
      }),
    ).toThrow(/overlaps with collection/);
  });

  test("throws when an item file sits inside a tree directory", () => {
    expect(() =>
      assertNoOverlappingPaths({
        collectionDirs: [],
        itemFiles: ["/docs/preamble.md"],
        treeDirs: ["/docs"],
      }),
    ).toThrow(
      /Item file "\/docs\/preamble\.md" sits inside tree directory "\/docs"/,
    );
  });

  test("throws when an item file sits inside a collection directory", () => {
    expect(() =>
      assertNoOverlappingPaths({
        collectionDirs: ["/posts"],
        itemFiles: ["/posts/intro.md"],
        treeDirs: [],
      }),
    ).toThrow(
      /Item file "\/posts\/intro\.md" sits inside collection directory "\/posts"/,
    );
  });

  test("allows an item path that shares a prefix but is not inside the tree", () => {
    expect(() =>
      assertNoOverlappingPaths({
        collectionDirs: [],
        itemFiles: ["/docs-extra.md"],
        treeDirs: ["/docs"],
      }),
    ).not.toThrow();
  });
});
