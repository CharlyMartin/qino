import { describe, expect, test } from "vitest";

import { makeDummyNode } from "../../test-utils/make-dummy-node";
import { getAncestorNodes } from "./get-ancestor-nodes";

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
];

describe("getAncestorNodes", () => {
  test("returns an empty array for a root-level node", () => {
    expect(
      getAncestorNodes({ tree, slug: "introduction", directory: "docs" }),
    ).toEqual([]);
  });

  test("returns the parent of a first-level child", () => {
    expect(
      getAncestorNodes({
        tree,
        slug: "guides/queries",
        directory: "docs",
      }).map((node) => node.slug),
    ).toEqual(["guides"]);
  });

  test("returns every ancestor from the root down, excluding the node itself", () => {
    expect(
      getAncestorNodes({
        tree,
        slug: "guides/mutations/optimistic",
        directory: "docs",
      }).map((node) => node.slug),
    ).toEqual(["guides", "guides/mutations"]);
  });

  test("throws with the requested slug when it does not exist", () => {
    expect(() =>
      getAncestorNodes({ tree, slug: "guides/nope", directory: "docs" }),
    ).toThrow(/Tree entry "guides\/nope" not found in tree "docs"/);
  });

  test("throws when the tree is empty", () => {
    expect(() =>
      getAncestorNodes({ tree: [], slug: "anything", directory: "docs" }),
    ).toThrow(/Tree entry "anything" not found in tree "docs"/);
  });
});
