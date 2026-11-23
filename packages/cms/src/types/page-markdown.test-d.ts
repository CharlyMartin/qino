import { describe, expectTypeOf, test } from "vitest";
import { z } from "zod";

import { initQino } from "../runtime/qino/init-qino";
import type { PageMarkdownPropValue } from "./page-markdown";

const { defineCollection, defineItem, defineTree } = initQino({
  contentFolder: "src/content",
  mediaFolder: "public",
  siteUrl: "https://example.com",
});

describe("agentMarkdown.components", () => {
  test("receive literal props, Markdown children and the entry as read", () => {
    defineCollection({
      directory: "posts",
      schema: z.object({ title: z.string() }),
      extension: ".mdx",
      agentMarkdown: {
        components: {
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
      agentMarkdown: {
        components: {
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

  test("are accepted on trees and items", () => {
    defineTree({
      directory: "docs",
      schema: z.object({ label: z.string() }),
      extension: ".mdx",
      titleField: "label",
      agentMarkdown: {
        components: { Label: ({ entry }) => entry.label },
      },
    });
    defineItem({
      file: "about.mdx",
      schema: z.object({ name: z.string() }),
      agentMarkdown: {
        components: { Name: ({ entry }) => entry.name },
      },
    });
  });

  test("are rejected on JSON files, which have no body", () => {
    defineCollection({
      directory: "authors",
      schema: z.object({}),
      extension: ".json",
      // @ts-expect-error: JSON files have no Markdown body
      agentMarkdown: { components: {} },
    });
  });

  test("can query their own primitive, as a LinkGrid listing a node's children does", () => {
    const docsTree = defineTree({
      directory: "docs",
      schema: z.object({ label: z.string() }),
      extension: ".mdx",
      titleField: "label",
      pages: { index: "/docs", entry: "/docs/{slug}", title: "Docs" },
      agentMarkdown: {
        components: {
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
