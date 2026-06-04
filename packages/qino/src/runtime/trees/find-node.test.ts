import { describe, expect, test } from "vitest";

import { makeDummyNode } from "../../utils/tests";
import { findNode } from "./find-node";

describe("findNode", () => {
  test("returns a root-level node by slug", () => {
    const tree = [
      makeDummyNode({ slug: "introduction", extension: ".md" }),
      makeDummyNode({ slug: "installation", extension: ".md" }),
    ];
    expect(findNode(tree, "installation", "/docs").slug).toBe("installation");
  });

  test("returns a deeply nested node by slash slug", () => {
    const tree = [
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
    expect(findNode(tree, "guides/mutations/optimistic", "/docs").slug).toBe(
      "guides/mutations/optimistic",
    );
  });

  test("throws when slug does not exist", () => {
    const tree = [makeDummyNode({ slug: "introduction", extension: ".md" })];
    expect(() => findNode(tree, "nope", "/docs")).toThrow(
      /Tree entry "nope" not found in tree "\/docs"/,
    );
  });

  test("throws when intermediate slug segment does not exist", () => {
    const tree = [makeDummyNode({ slug: "guides", extension: ".md" })];
    expect(() => findNode(tree, "guides/missing", "/docs")).toThrow(
      /Tree entry "guides\/missing" not found/,
    );
  });
});
