import { expect, test } from "vitest";

import { hasDocsSlug } from "./has-docs-slug";

const nodes = [
  { slug: "guide", title: "Guide", children: [] },
  {
    slug: "api",
    title: "API",
    children: [
      {
        slug: "api/tree",
        title: "Tree",
        children: [
          { slug: "api/tree/get-tree", title: "Get tree", children: [] },
        ],
      },
    ],
  },
];

test.each(["guide", "api", "api/tree", "api/tree/get-tree"])(
  "finds the existing slug %s",
  (slug) => {
    expect(hasDocsSlug(nodes, slug)).toBe(true);
  },
);

test.each(["", "missing", "api/missing", "tree", "Guide", "guide/child"])(
  "rejects the unknown slug %s",
  (slug) => {
    expect(hasDocsSlug(nodes, slug)).toBe(false);
  },
);

test("rejects slugs in an empty tree", () => {
  expect(hasDocsSlug([], "guide")).toBe(false);
});
