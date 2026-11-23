import { describe, expectTypeOf, test } from "vitest";
import { z } from "zod";

import { initQino } from "../runtime/qino/init-qino";

const { defineCollection, defineItem, defineTree } = initQino({
  contentFolder: "src/content",
  mediaFolder: "public",
  siteUrl: "https://example.com",
});

const postCollection = defineCollection({
  directory: "posts",
  schema: z.object({ title: z.string(), draft: z.boolean() }),
  extension: ".md",
  pages: { index: "/blog", entry: "/blog/{slug}", title: "Blog" },
  views: (view) => ({
    default: view({ filter: (post) => !post.draft }),
    all: view({}),
  }),
});

describe("pages on collections", () => {
  test("take an index path and an entry path with {slug}", () => {
    defineCollection({
      directory: "notes",
      schema: z.object({}),
      extension: ".md",
      pages: {
        index: "/",
        entry: "/notes/{slug}",
        title: "Notes",
        llmsFull: false,
      },
    });
  });

  test("need a title for the index page", () => {
    defineCollection({
      directory: "notes",
      schema: z.object({}),
      extension: ".md",
      // @ts-expect-error: pages take a title
      pages: { index: "/notes", entry: "/notes/{slug}" },
    });
  });

  test("reject paths without a leading /", () => {
    defineCollection({
      directory: "notes",
      schema: z.object({}),
      extension: ".md",
      // @ts-expect-error: the index path starts with "/"
      pages: { index: "notes", entry: "/notes/{slug}", title: "Notes" },
    });
  });

  test("reject an entry path without {slug}", () => {
    defineCollection({
      directory: "notes",
      schema: z.object({}),
      extension: ".md",
      // @ts-expect-error: the entry path contains {slug}
      pages: { index: "/notes", entry: "/notes", title: "Notes" },
    });
  });
});

describe("getPageMarkdown", () => {
  test("takes any string, and resolves to Markdown or null", () => {
    const slug: string = "from-a-route-param";

    expectTypeOf(postCollection.getPageMarkdown(slug)).toEqualTypeOf<
      Promise<string | null>
    >();
  });

  test("takes a view the collection defines", () => {
    postCollection.getPageMarkdown("hello", { view: "all" });
    // @ts-expect-error: no such view
    postCollection.getPageMarkdown("hello", { view: "missing" });
  });

  test("resolves to the index page's Markdown without a slug", () => {
    expectTypeOf(postCollection.getPageMarkdown()).toEqualTypeOf<
      Promise<string>
    >();
  });

  test("rejects a slug that may be undefined, which would read the index page", () => {
    const slug = undefined as string | undefined;

    // @ts-expect-error: pass a string, or no argument for the index page
    postCollection.getPageMarkdown(slug);
  });
});

describe("getMarkdownUrl", () => {
  test("returns a URL, for an entry page or the index page", () => {
    expectTypeOf(
      postCollection.getMarkdownUrl("hello"),
    ).toEqualTypeOf<string>();
    expectTypeOf(postCollection.getMarkdownUrl()).toEqualTypeOf<string>();
  });
});

const docsTree = defineTree({
  directory: "docs",
  schema: z.object({ label: z.string() }),
  extension: ".mdx",
  titleField: "label",
  pages: { index: "/docs", entry: "/docs/{slug}", title: "Docs" },
});

const aboutItem = defineItem({
  file: "about.md",
  schema: z.object({ title: z.string() }),
  page: "/about",
});

describe("pages on trees and items", () => {
  test("are accepted on trees", () => {
    expectTypeOf(docsTree.getPageMarkdown("guide/cli")).toEqualTypeOf<
      Promise<string | null>
    >();
    expectTypeOf(docsTree.getMarkdownUrl("guide/cli")).toEqualTypeOf<string>();
  });

  test("give trees an index page without a slug", () => {
    expectTypeOf(docsTree.getPageMarkdown()).toEqualTypeOf<Promise<string>>();
    expectTypeOf(docsTree.getMarkdownUrl()).toEqualTypeOf<string>();

    const slug = undefined as string | undefined;
    // @ts-expect-error: pass a string, or no argument for the index page
    docsTree.getPageMarkdown(slug);
  });

  test("are rejected on items, which take a page", () => {
    defineItem({
      file: "about.md",
      schema: z.object({}),
      // @ts-expect-error: items take `page`
      pages: { index: "/about", entry: "/about/{slug}", title: "About" },
    });
  });

  test("give items page Markdown and a Markdown URL without a slug", () => {
    expectTypeOf(aboutItem.getPageMarkdown()).toEqualTypeOf<Promise<string>>();
    expectTypeOf(aboutItem.getMarkdownUrl()).toEqualTypeOf<string>();
  });

  test("give items page Markdown with a page in its object form", () => {
    const item = defineItem({
      file: "about.mdx",
      schema: z.object({}),
      page: { path: "/about" },
    });

    expectTypeOf(item.getPageMarkdown()).toEqualTypeOf<Promise<string>>();
    expectTypeOf(item.getMarkdownUrl()).toEqualTypeOf<string>();
  });

  test("take page on items only", () => {
    defineCollection({
      directory: "notes",
      schema: z.object({}),
      extension: ".md",
      // @ts-expect-error: collections take `pages`
      page: "/notes",
    });
    defineTree({
      directory: "guides",
      schema: z.object({ label: z.string() }),
      extension: ".mdx",
      titleField: "label",
      // @ts-expect-error: trees take `pages`
      page: "/guides",
    });
    defineCollection({
      directory: "notes",
      schema: z.object({}),
      extension: ".mdx",
      // @ts-expect-error: collections take `pages`
      page: { path: "/notes" },
    });
  });

  test("reject an item's page without a leading /", () => {
    defineItem({
      file: "about.md",
      schema: z.object({}),
      // @ts-expect-error: the page starts with "/"
      page: "about",
    });
    defineItem({
      file: "about.md",
      schema: z.object({}),
      // @ts-expect-error: the page starts with "/"
      page: { path: "about" },
    });
  });
});

describe("cli.build.llmsTxt", () => {
  test("takes true or a template path", () => {
    initQino({
      contentFolder: "c",
      mediaFolder: "p",
      cli: { build: { llmsTxt: true } },
    });
    initQino({
      contentFolder: "c",
      mediaFolder: "p",
      cli: { build: { llmsTxt: { template: "agents/llms.md" } } },
    });
    initQino({
      contentFolder: "c",
      mediaFolder: "p",
      // @ts-expect-error: the template is a path
      cli: { build: { llmsTxt: { template: 1 } } },
    });
  });
});
