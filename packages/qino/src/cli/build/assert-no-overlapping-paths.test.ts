import { describe, expect, test } from "vitest";

import { QinoMeta } from "../../data";
import type { AnyCollection, AnySingleton, AnyTree } from "../../types";
import {
  makeDummyCollection,
  makeDummySingleton,
  makeDummyTree,
} from "../../utils/tests";
import { assertNoOverlappingPaths } from "./assert-no-overlapping-paths";

function collectionMap(entries: Array<AnyCollection>) {
  return new Map(entries.map((c) => [c[QinoMeta].directory, c]));
}

function singletonMap(entries: Array<AnySingleton>) {
  return new Map(entries.map((s) => [s[QinoMeta].file, s]));
}

function treeMap(entries: Array<AnyTree>) {
  return new Map(entries.map((t) => [t[QinoMeta].directory, t]));
}

describe("assertNoOverlappingPaths", () => {
  test("passes when paths are disjoint", () => {
    const collections = collectionMap([
      makeDummyCollection({ directory: "/authors", extension: ".md" }),
    ]);
    const singletons = singletonMap([
      makeDummySingleton({ file: "/pages/home.md" }),
    ]);
    const trees = treeMap([makeDummyTree({ directory: "/docs" })]);

    expect(() =>
      assertNoOverlappingPaths(collections, singletons, trees),
    ).not.toThrow();
  });

  test("throws when one tree directory is a prefix of another", () => {
    const trees = treeMap([
      makeDummyTree({ directory: "/docs" }),
      makeDummyTree({ directory: "/docs/api" }),
    ]);

    expect(() =>
      assertNoOverlappingPaths(new Map(), new Map(), trees),
    ).toThrow(/Tree directories overlap.*\/docs.*\/docs\/api/);
  });

  test("throws when a tree directory is a prefix of a collection directory", () => {
    const collections = collectionMap([
      makeDummyCollection({ directory: "/docs/api", extension: ".md" }),
    ]);
    const trees = treeMap([makeDummyTree({ directory: "/docs" })]);

    expect(() =>
      assertNoOverlappingPaths(collections, new Map(), trees),
    ).toThrow(/Tree directory "\/docs" overlaps with collection/);
  });

  test("throws when a collection directory equals a tree directory", () => {
    const collections = collectionMap([
      makeDummyCollection({ directory: "/docs", extension: ".md" }),
    ]);
    const trees = treeMap([makeDummyTree({ directory: "/docs" })]);

    expect(() =>
      assertNoOverlappingPaths(collections, new Map(), trees),
    ).toThrow(/overlaps with collection/);
  });

  test("throws when a singleton file sits inside a tree directory", () => {
    const singletons = singletonMap([
      makeDummySingleton({ file: "/docs/preamble.md" }),
    ]);
    const trees = treeMap([makeDummyTree({ directory: "/docs" })]);

    expect(() =>
      assertNoOverlappingPaths(new Map(), singletons, trees),
    ).toThrow(
      /Singleton file "\/docs\/preamble\.md" sits inside tree directory "\/docs"/,
    );
  });

  test("allows a singleton path that shares a prefix but is not inside the tree", () => {
    const singletons = singletonMap([
      makeDummySingleton({ file: "/docs-extra.md" }),
    ]);
    const trees = treeMap([makeDummyTree({ directory: "/docs" })]);

    expect(() =>
      assertNoOverlappingPaths(new Map(), singletons, trees),
    ).not.toThrow();
  });
});
