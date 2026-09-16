import { describe, expect, test } from "vitest";

import { makeDummyNode } from "../../test-utils/make-dummy-node";
import { flattenTree } from "./flatten-tree";

describe("flattenTree", () => {
  test("returns an empty array for empty input", () => {
    expect(flattenTree([])).toEqual([]);
  });

  test("returns flat input unchanged in order", () => {
    const tree = [
      makeDummyNode({ slug: "introduction", extension: ".md" }),
      makeDummyNode({ slug: "installation", extension: ".md" }),
    ];
    expect(flattenTree(tree).map((n) => n.slug)).toEqual([
      "introduction",
      "installation",
    ]);
  });

  test("walks nested children depth-first in pre-order", () => {
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

    expect(flattenTree(tree).map((n) => n.slug)).toEqual([
      "introduction",
      "guides",
      "guides/queries",
      "guides/mutations",
      "guides/mutations/optimistic",
      "reference",
    ]);
  });

  test("preserves sibling order from input", () => {
    const tree = [
      makeDummyNode({ slug: "c", extension: ".md" }),
      makeDummyNode({ slug: "a", extension: ".md" }),
      makeDummyNode({ slug: "b", extension: ".md" }),
    ];
    expect(flattenTree(tree).map((n) => n.slug)).toEqual(["c", "a", "b"]);
  });
});
