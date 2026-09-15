import { describe, expect, test } from "vitest";

import { makeDummyNode } from "../../test-utils/make-dummy-node";
import { getNeighborNode } from "./get-neighbor-node";

describe("getNeighborNode", () => {
  test("returns the next sibling at root level", () => {
    const tree = [
      makeDummyNode({ slug: "introduction", extension: ".md" }),
      makeDummyNode({ slug: "installation", extension: ".md" }),
      makeDummyNode({ slug: "reference", extension: ".md" }),
    ];
    expect(
      getNeighborNode({
        tree,
        slug: "introduction",
        directory: "/docs",
        offset: 1,
      })?.slug,
    ).toBe("installation");
  });

  test("returns the previous sibling at root level", () => {
    const tree = [
      makeDummyNode({ slug: "introduction", extension: ".md" }),
      makeDummyNode({ slug: "installation", extension: ".md" }),
      makeDummyNode({ slug: "reference", extension: ".md" }),
    ];
    expect(
      getNeighborNode({
        tree,
        slug: "reference",
        directory: "/docs",
        offset: -1,
      })?.slug,
    ).toBe("installation");
  });

  test("descends into the first child when crossing into nested children", () => {
    const tree = [
      makeDummyNode({ slug: "introduction", extension: ".md" }),
      makeDummyNode({
        slug: "guides",
        extension: ".md",
        children: [
          makeDummyNode({ slug: "guides/queries", extension: ".md" }),
          makeDummyNode({
            slug: "guides/mutations",
            extension: ".md",
            children: [
              makeDummyNode({
                slug: "guides/mutations/optimistic",
                extension: ".md",
              }),
            ],
          }),
        ],
      }),
      makeDummyNode({ slug: "reference", extension: ".md" }),
    ];
    expect(
      getNeighborNode({
        tree,
        slug: "guides",
        directory: "/docs",
        offset: 1,
      })?.slug,
    ).toBe("guides/queries");
  });

  test("crosses out of nested children to the next root sibling", () => {
    const tree = [
      makeDummyNode({ slug: "introduction", extension: ".md" }),
      makeDummyNode({
        slug: "guides",
        extension: ".md",
        children: [
          makeDummyNode({ slug: "guides/queries", extension: ".md" }),
          makeDummyNode({
            slug: "guides/mutations",
            extension: ".md",
            children: [
              makeDummyNode({
                slug: "guides/mutations/optimistic",
                extension: ".md",
              }),
            ],
          }),
        ],
      }),
      makeDummyNode({ slug: "reference", extension: ".md" }),
    ];
    expect(
      getNeighborNode({
        tree,
        slug: "guides/mutations/optimistic",
        directory: "/docs",
        offset: 1,
      })?.slug,
    ).toBe("reference");
  });

  test("returns null when there is no previous neighbor at the start", () => {
    const tree = [
      makeDummyNode({ slug: "introduction", extension: ".md" }),
      makeDummyNode({ slug: "installation", extension: ".md" }),
    ];
    expect(
      getNeighborNode({
        tree,
        slug: "introduction",
        directory: "/docs",
        offset: -1,
      }),
    ).toBeNull();
  });

  test("returns null when there is no next neighbor at the deeply nested end", () => {
    const tree = [
      makeDummyNode({ slug: "introduction", extension: ".md" }),
      makeDummyNode({
        slug: "guides",
        extension: ".md",
        children: [
          makeDummyNode({
            slug: "guides/mutations",
            extension: ".md",
            children: [
              makeDummyNode({
                slug: "guides/mutations/optimistic",
                extension: ".md",
              }),
            ],
          }),
        ],
      }),
    ];
    expect(
      getNeighborNode({
        tree,
        slug: "guides/mutations/optimistic",
        directory: "/docs",
        offset: 1,
      }),
    ).toBeNull();
  });

  test("returns null in either direction for a single-node tree", () => {
    const tree = [makeDummyNode({ slug: "introduction", extension: ".md" })];
    expect(
      getNeighborNode({
        tree,
        slug: "introduction",
        directory: "/docs",
        offset: 1,
      }),
    ).toBeNull();
    expect(
      getNeighborNode({
        tree,
        slug: "introduction",
        directory: "/docs",
        offset: -1,
      }),
    ).toBeNull();
  });

  test("throws when slug does not exist", () => {
    const tree = [makeDummyNode({ slug: "introduction", extension: ".md" })];
    expect(() =>
      getNeighborNode({ tree, slug: "nope", directory: "/docs", offset: 1 }),
    ).toThrow(/Tree entry "nope" not found in tree "\/docs"/);
  });

  test("throws when the tree is empty", () => {
    expect(() =>
      getNeighborNode({
        tree: [],
        slug: "anything",
        directory: "/docs",
        offset: 1,
      }),
    ).toThrow(/Tree entry "anything" not found in tree "\/docs"/);
  });
});
