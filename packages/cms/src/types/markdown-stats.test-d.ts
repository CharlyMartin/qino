import { describe, expectTypeOf, test } from "vitest";
import { z } from "zod";

import { initQino } from "../runtime/qino/init-qino";
import type { Infer } from "./infer";
import type { MarkdownStats } from "./markdown-stats";

const { defineCollection, defineItem, defineTree } = initQino({
  contentFolder: "src/content",
  mediaFolder: "public",
});

const authorCollection = defineCollection({
  directory: "authors",
  schema: z.object({ name: z.string() }),
  extension: ".md",
  markdownStats: true,
});

const postCollection = defineCollection({
  directory: "posts",
  schema: z.object({ title: z.string(), author: z.string() }),
  extension: ".mdx",
  relations: { author: authorCollection },
  markdownStats: true,
  views: (view) => ({
    default: view({}),
    resolved: view({
      resolveRelations: 1,
      augment: (post) => {
        expectTypeOf(post._stats).toEqualTypeOf<MarkdownStats>();
        expectTypeOf(post.author._stats).toEqualTypeOf<MarkdownStats>();
        return { readingMinutes: Math.ceil(post._stats.wordCount / 220) };
      },
    }),
  }),
});

describe("_stats", () => {
  test("is added with markdownStats", async () => {
    expectTypeOf<
      Infer<typeof postCollection>["output"]["_stats"]
    >().toEqualTypeOf<MarkdownStats>();

    const post = await postCollection.getEntry("hello", { view: "resolved" });
    expectTypeOf(post._stats).toEqualTypeOf<MarkdownStats>();
    expectTypeOf(post.author._stats).toEqualTypeOf<MarkdownStats>();
    expectTypeOf(post.readingMinutes).toEqualTypeOf<number>();
  });

  test("applies to items and trees", async () => {
    const about = defineItem({
      file: "about.md",
      schema: z.object({ title: z.string() }),
      markdownStats: true,
    });
    const docs = defineTree({
      directory: "docs",
      schema: z.object({ title: z.string() }),
      extension: ".markdown",
      titleField: "title",
      markdownStats: true,
    });

    expectTypeOf(
      (await about.getEntry())._stats,
    ).toEqualTypeOf<MarkdownStats>();
    expectTypeOf(
      (await docs.getEntry("a"))._stats,
    ).toEqualTypeOf<MarkdownStats>();
  });

  test("is absent without markdownStats", async () => {
    const plain = defineCollection({
      directory: "plain",
      schema: z.object({ title: z.string() }),
      extension: ".md",
    });
    const off = defineCollection({
      directory: "off",
      schema: z.object({ title: z.string() }),
      extension: ".md",
      markdownStats: false,
    });

    expectTypeOf(await plain.getEntry("a")).not.toHaveProperty("_stats");
    expectTypeOf(await off.getEntry("a")).not.toHaveProperty("_stats");
  });

  test("can't be overwritten by augment", () => {
    defineCollection({
      directory: "posts",
      schema: z.object({ title: z.string() }),
      extension: ".md",
      markdownStats: true,
      views: (view) => ({
        // @ts-expect-error _stats is added by Qino.
        default: view({ augment: () => ({ _stats: 1 }) }),
      }),
    });
  });
});

describe("markdownStats config", () => {
  test("rejects JSON files", () => {
    defineCollection({
      directory: "authors",
      schema: z.object({ name: z.string() }),
      extension: ".json",
      // @ts-expect-error JSON files have no Markdown body.
      markdownStats: true,
    });
    defineItem({
      file: "home.json",
      schema: z.object({ title: z.string() }),
      // @ts-expect-error JSON files have no Markdown body.
      markdownStats: true,
    });
    defineTree({
      directory: "docs",
      schema: z.object({ title: z.string() }),
      extension: ".json",
      titleField: "title",
      // @ts-expect-error JSON files have no Markdown body.
      markdownStats: true,
    });
  });

  test("accepts false on JSON files", () => {
    defineCollection({
      directory: "authors",
      schema: z.object({ name: z.string() }),
      extension: ".json",
      markdownStats: false,
    });
  });

  test("reserves _stats in Markdown schemas", () => {
    defineCollection({
      directory: "posts",
      // @ts-expect-error _stats is reserved.
      schema: z.object({ _stats: z.string() }),
      extension: ".md",
    });
    defineCollection({
      directory: "authors",
      schema: z.object({ _stats: z.string() }),
      extension: ".json",
    });
  });
});
