import { describe, expect, test } from "vitest";

import type { NodeTree } from "../../types";
import { makeDummyNode } from "../../utils/tests";
import { getOrderedNodeTrees } from "./get-ordered-node-trees";

function makeCandidates(slugs: Array<string>) {
  return new Map(
    slugs.map((slug) => [slug, makeDummyNode({ slug, extension: ".md" })]),
  );
}

describe("getOrderedNodeTrees", () => {
  test("returns all candidates in Map insertion order when no order is provided", () => {
    const candidates = makeCandidates(["intro", "guides", "react"]);
    const result = getOrderedNodeTrees({ candidates });
    expect(result.map((node) => node.slug)).toEqual([
      "intro",
      "guides",
      "react",
    ]);
  });

  test("returns an empty array when candidates is empty and no order is provided", () => {
    expect(getOrderedNodeTrees({ candidates: new Map() })).toEqual([]);
  });

  test("orders candidates according to order.entries", () => {
    const candidates = makeCandidates(["intro", "guides", "react"]);
    const result = getOrderedNodeTrees({
      candidates,
      order: {
        path: "/posts/_order.json",
        entries: ["react.md", "intro.md", "guides.md"],
      },
    });
    expect(result.map((node) => node.slug)).toEqual([
      "react",
      "intro",
      "guides",
    ]);
  });

  test("appends candidates not listed in order after the ordered ones", () => {
    const candidates = makeCandidates(["intro", "guides", "react", "advanced"]);
    const result = getOrderedNodeTrees({
      candidates,
      order: {
        path: "/posts/_order.json",
        entries: ["react.md", "intro.md"],
      },
    });
    expect(result.map((node) => node.slug)).toEqual([
      "react",
      "intro",
      "guides",
      "advanced",
    ]);
  });

  test("appended candidates preserve Map insertion order", () => {
    const candidates = new Map<string, NodeTree>();
    candidates.set("z", makeDummyNode({ slug: "z", extension: ".md" }));
    candidates.set("a", makeDummyNode({ slug: "a", extension: ".md" }));
    candidates.set("m", makeDummyNode({ slug: "m", extension: ".md" }));
    const result = getOrderedNodeTrees({
      candidates,
      order: { path: "/posts/_order.json", entries: ["a.md"] },
    });
    expect(result.map((node) => node.slug)).toEqual(["a", "z", "m"]);
  });

  test("throws when an order entry has no matching candidate", () => {
    const candidates = makeCandidates(["intro", "guides"]);
    expect(() =>
      getOrderedNodeTrees({
        candidates,
        order: {
          path: "/posts/_order.json",
          entries: ["intro.md", "missing.md"],
        },
      }),
    ).toThrow(/_order\.json.*"missing\.md".*does not exist/);
  });

  test("error message mentions the bare folder name as a fallback", () => {
    const candidates = makeCandidates(["intro"]);
    expect(() =>
      getOrderedNodeTrees({
        candidates,
        order: {
          path: "/posts/_order.json",
          entries: ["missing.md"],
        },
      }),
    ).toThrow(/"missing\/"/);
  });

  test("returns all candidates when order.entries is empty", () => {
    const candidates = makeCandidates(["intro", "guides"]);
    const result = getOrderedNodeTrees({
      candidates,
      order: { path: "/posts/_order.json", entries: [] },
    });
    expect(result.map((node) => node.slug)).toEqual(["intro", "guides"]);
  });

  test("returns the actual NodeTree objects from the candidates map", () => {
    const intro = makeDummyNode({
      slug: "intro",
      extension: ".md",
      title: "Introduction",
    });
    const guides = makeDummyNode({
      slug: "guides",
      extension: ".md",
      title: "Guides",
    });
    const candidates = new Map([
      ["intro", intro],
      ["guides", guides],
    ]);
    const result = getOrderedNodeTrees({
      candidates,
      order: { path: "/posts/_order.json", entries: ["guides.md"] },
    });
    expect(result[0]).toBe(guides);
    expect(result[1]).toBe(intro);
  });
});
