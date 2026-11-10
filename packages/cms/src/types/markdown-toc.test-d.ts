import { describe, expectTypeOf, test } from "vitest";
import { z } from "zod";

import { initQino } from "../runtime/qino/init-qino";
import type { Infer } from "./infer";
import type { MarkdownToc } from "./markdown-toc";

const { defineCollection, defineItem, defineTree } = initQino({
  contentFolder: "src/content",
  mediaFolder: "public",
});

const authorCollection = defineCollection({
  directory: "authors",
  schema: z.object({ name: z.string() }),
  extension: ".md",
  markdownToc: true,
});

const postCollection = defineCollection({
  directory: "posts",
  schema: z.object({ title: z.string(), author: z.string() }),
  extension: ".mdx",
  relations: { author: authorCollection },
  markdownToc: { upTo: "h3" },
  markdownStats: true,
  views: (view) => ({
    default: view({}),
    resolved: view({
      resolveDepth: { author: 1 },
      augment: (post) => {
        expectTypeOf(post._toc).toEqualTypeOf<MarkdownToc>();
        expectTypeOf(post.author._toc).toEqualTypeOf<MarkdownToc>();
        return { sectionCount: post._toc.length };
      },
    }),
  }),
});

describe("_toc", () => {
  test("is added with markdownToc", async () => {
    expectTypeOf<
      Infer<typeof postCollection>["output"]["_toc"]
    >().toEqualTypeOf<MarkdownToc>();

    const post = await postCollection.getEntry("hello", { view: "resolved" });
    expectTypeOf(post._toc).toEqualTypeOf<MarkdownToc>();
    expectTypeOf<(typeof post._toc)[number]["heading"]>().toEqualTypeOf<
      1 | 2 | 3 | 4 | 5 | 6
    >();
    expectTypeOf(post.author._toc).toEqualTypeOf<MarkdownToc>();
    expectTypeOf(post.sectionCount).toEqualTypeOf<number>();
    expectTypeOf(post._stats.wordCount).toEqualTypeOf<number>();
  });

  test("applies to items and trees", async () => {
    const about = defineItem({
      file: "about.md",
      schema: z.object({ title: z.string() }),
      markdownToc: true,
    });
    const docs = defineTree({
      directory: "docs",
      schema: z.object({ title: z.string() }),
      extension: ".markdown",
      titleField: "title",
      markdownToc: { upTo: "h2" },
    });

    expectTypeOf((await about.getEntry())._toc).toEqualTypeOf<MarkdownToc>();
    expectTypeOf((await docs.getEntry("a"))._toc).toEqualTypeOf<MarkdownToc>();
  });

  test("is absent without markdownToc", async () => {
    const plain = defineCollection({
      directory: "plain",
      schema: z.object({ title: z.string() }),
      extension: ".md",
    });
    const off = defineCollection({
      directory: "off",
      schema: z.object({ title: z.string() }),
      extension: ".md",
      markdownToc: false,
    });

    expectTypeOf(await plain.getEntry("a")).not.toHaveProperty("_toc");
    expectTypeOf(await off.getEntry("a")).not.toHaveProperty("_toc");
  });

  test("can't be overwritten by augment", () => {
    defineCollection({
      directory: "posts",
      schema: z.object({ title: z.string() }),
      extension: ".md",
      markdownToc: true,
      views: (view) => ({
        // @ts-expect-error _toc is added by Qino.
        default: view({ augment: () => ({ _toc: 1 }) }),
      }),
    });
  });
});

describe("markdownToc config", () => {
  test("rejects JSON files", () => {
    defineCollection({
      directory: "authors",
      schema: z.object({ name: z.string() }),
      extension: ".json",
      // @ts-expect-error JSON files have no Markdown headings.
      markdownToc: true,
    });
    defineItem({
      file: "home.json",
      schema: z.object({ title: z.string() }),
      // @ts-expect-error JSON files have no Markdown headings.
      markdownToc: { upTo: "h2" },
    });
    defineTree({
      directory: "docs",
      schema: z.object({ title: z.string() }),
      extension: ".json",
      titleField: "title",
      // @ts-expect-error JSON files have no Markdown headings.
      markdownToc: true,
    });
  });

  test("accepts false on JSON files", () => {
    defineCollection({
      directory: "authors",
      schema: z.object({ name: z.string() }),
      extension: ".json",
      markdownToc: false,
    });
  });

  test("types slug's text and accepts it without upTo", async () => {
    const posts = defineCollection({
      directory: "posts",
      schema: z.object({ title: z.string() }),
      extension: ".md",
      markdownToc: {
        slug: (text) => {
          expectTypeOf(text).toEqualTypeOf<string>();
          return text.replace(/\W/g, "");
        },
      },
    });

    expectTypeOf((await posts.getEntry("a"))._toc).toEqualTypeOf<MarkdownToc>();
  });

  test("adds _toc for any options object", async () => {
    const empty = defineCollection({
      directory: "empty",
      schema: z.object({ title: z.string() }),
      extension: ".md",
      markdownToc: {},
    });
    const both = defineCollection({
      directory: "both",
      schema: z.object({ title: z.string() }),
      extension: ".md",
      markdownToc: { upTo: "h3", slug: (text) => text.toLowerCase() },
    });

    expectTypeOf((await empty.getEntry("a"))._toc).toEqualTypeOf<MarkdownToc>();
    expectTypeOf((await both.getEntry("a"))._toc).toEqualTypeOf<MarkdownToc>();
  });

  test("is absent for a runtime boolean, which may be false", async () => {
    const enabled = Math.random() > 0.5;
    const maybe = defineCollection({
      directory: "maybe",
      schema: z.object({ title: z.string() }),
      extension: ".md",
      markdownToc: enabled,
    });

    expectTypeOf(await maybe.getEntry("a")).not.toHaveProperty("_toc");
  });

  test("rejects slug options on JSON files", () => {
    defineCollection({
      directory: "authors",
      schema: z.object({ name: z.string() }),
      extension: ".json",
      // @ts-expect-error JSON files have no Markdown headings.
      markdownToc: { slug: (text: string) => text },
    });
  });

  test("rejects a slug that doesn't return a string", () => {
    defineCollection({
      directory: "posts",
      schema: z.object({ title: z.string() }),
      extension: ".md",
      // @ts-expect-error slug returns the id.
      markdownToc: { slug: (text: string) => text.length },
    });
  });

  test("only accepts heading tags in upTo", () => {
    defineCollection({
      directory: "posts",
      schema: z.object({ title: z.string() }),
      extension: ".md",
      // @ts-expect-error h7 isn't a heading tag.
      markdownToc: { upTo: "h7" },
    });
  });

  test("reserves _toc in Markdown schemas", () => {
    defineCollection({
      directory: "posts",
      // @ts-expect-error _toc is reserved.
      schema: z.object({ _toc: z.string() }),
      extension: ".md",
    });
    defineCollection({
      directory: "authors",
      schema: z.object({ _toc: z.string() }),
      extension: ".json",
    });
  });
});
