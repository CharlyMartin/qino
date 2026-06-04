import { describe, expect, test } from "vitest";

import { makeDummyNode } from "../../utils/tests";
import { findNode } from "./find-node";

describe("findNode", () => {
  test("returns a root-level node by slug", () => {
    const tree = [
      makeDummyNode({ slug: "introduction" }),
      makeDummyNode({ slug: "installation" }),
    ];
    expect(findNode(tree, "installation", "/docs").slug).toBe("installation");
  });

  test("returns a deeply nested node by slash slug", () => {
    const tree = [
      makeDummyNode({
        slug: "guides",
        children: [
          makeDummyNode({ slug: "guides/queries" }),
          makeDummyNode({
            slug: "guides/mutations",
            children: [makeDummyNode({ slug: "guides/mutations/optimistic" })],
          }),
        ],
      }),
    ];
    expect(findNode(tree, "guides/mutations/optimistic", "/docs").slug).toBe(
      "guides/mutations/optimistic",
    );
  });

  test("throws when slug does not exist", () => {
    const tree = [makeDummyNode({ slug: "introduction" })];
    expect(() => findNode(tree, "nope", "/docs")).toThrow(
      /Tree entry "nope" not found in tree "\/docs"/,
    );
  });

  test("throws when intermediate slug segment does not exist", () => {
    const tree = [makeDummyNode({ slug: "guides" })];
    expect(() => findNode(tree, "guides/missing", "/docs")).toThrow(
      /Tree entry "guides\/missing" not found/,
    );
  });
});
