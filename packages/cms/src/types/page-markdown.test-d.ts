import { describe, expectTypeOf, test } from "vitest";
import { z } from "zod";

import { initQino } from "../runtime/qino/init-qino";
import type { PageMarkdownPropValue } from "./page-markdown";

const { defineCollection, defineItem, defineTree } = initQino({
  contentFolder: "src/content",
  mediaFolder: "public",
  siteUrl: "https://example.com",
});

const posts = {
  index: "/posts",
  entry: "/posts/{slug}",
  title: "Posts",
} as const;

describe("markdownComponents", () => {
  test("receive literal props, Markdown children and the entry as read", () => {
    defineCollection({
      directory: "posts",
      schema: z.object({ title: z.string() }),
      extension: ".mdx",
      pages: {
        ...posts,
        markdownComponents: {
          Box: ({ props, children, entry }) => {
            expectTypeOf(props).toEqualTypeOf<
              Record<string, PageMarkdownPropValue>
            >();
            expectTypeOf(children).toEqualTypeOf<string>();
            expectTypeOf(entry.title).toEqualTypeOf<string>();
            expectTypeOf(entry._meta.slug).toEqualTypeOf<string>();
            return children;
          },
        },
      },
    });
  });

  test("return a string or null, directly or through a promise", () => {
    defineCollection({
      directory: "posts",
      schema: z.object({}),
      extension: ".mdx",
      pages: {
        ...posts,
        markdownComponents: {
          Text: () => "text",
          Kept: () => null,
          Async: async () => "text",
          AsyncKept: async () => null,
          // @ts-expect-error: a function returns Markdown or null
          Count: () => 3,
        },
      },
    });
  });

  test("are accepted in a tree's pages and an item's page", () => {
    defineTree({
      directory: "docs",
      schema: z.object({ label: z.string() }),
      extension: ".mdx",
      titleField: "label",
      pages: {
        index: "/docs",
        entry: "/docs/{slug}",
        title: "Docs",
        markdownComponents: { Label: ({ entry }) => entry.label },
      },
    });
    defineItem({
      file: "about.mdx",
      schema: z.object({ name: z.string() }),
      page: {
        path: "/about",
        markdownComponents: { Name: ({ entry }) => entry.name },
      },
    });
  });

  test("are rejected on JSON files, which have no body, though pages aren't", () => {
    defineCollection({
      directory: "authors",
      schema: z.object({}),
      extension: ".json",
      pages: {
        index: "/authors",
        entry: "/authors/{slug}",
        title: "Authors",
        // @ts-expect-error: JSON files have no Markdown body
        markdownComponents: {},
      },
    });
    defineCollection({
      directory: "authors",
      schema: z.object({}),
      extension: ".json",
      pages: { index: "/authors", entry: "/authors/{slug}", title: "Authors" },
    });
    defineItem({
      file: "site.json",
      schema: z.object({}),
      page: {
        path: "/site",
        // @ts-expect-error: JSON files have no Markdown body
        markdownComponents: {},
      },
    });
  });

  test("replace the agentMarkdown option, which is gone", () => {
    defineCollection({
      directory: "posts",
      schema: z.object({}),
      extension: ".mdx",
      pages: posts,
      // @ts-expect-error: components go in pages.markdownComponents
      agentMarkdown: { components: {} },
    });
  });

  test("can query their own primitive, as a LinkGrid listing a node's children does", () => {
    const docsTree = defineTree({
      directory: "docs",
      schema: z.object({ label: z.string() }),
      extension: ".mdx",
      titleField: "label",
      pages: {
        index: "/docs",
        entry: "/docs/{slug}",
        title: "Docs",
        markdownComponents: {
          // Annotated: the function reads `docsTree`, whose type it's part of.
          LinkGrid: async ({ entry }): Promise<string> => {
            const node = await docsTree.getTree(entry._meta.slug);
            return node.children
              .map(
                (child) =>
                  `- [${child.title}](${docsTree.getMarkdownUrl(child.slug)})`,
              )
              .join("\n");
          },
        },
      },
    });

    expectTypeOf(docsTree.getPageMarkdown()).toEqualTypeOf<Promise<string>>();
  });
});
