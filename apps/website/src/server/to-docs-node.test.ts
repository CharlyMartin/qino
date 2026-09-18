import { expect, test } from "vitest";

import { toDocsNode } from "./to-docs-node";

test("navigation never exposes filesystem metadata, including nested nodes", () => {
  const child = {
    slug: "guide/install",
    title: "Install",
    fileName: "install.mdx",
    filePath: "/private/content/guide/install.mdx",
    children: [],
  };
  const node = {
    slug: "guide",
    title: "Guide",
    fileName: "guide.mdx",
    filePath: "/private/content/guide.mdx",
    children: [child],
  };

  expect(toDocsNode(node)).toEqual({
    slug: "guide",
    title: "Guide",
    children: [{ slug: "guide/install", title: "Install", children: [] }],
  });
  expect(node.children[0]).toBe(child);
});
