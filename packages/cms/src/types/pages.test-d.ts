import { describe, expectTypeOf, test } from "vitest";
import { z } from "zod";

import { initQino } from "../runtime/qino/init-qino";

const { defineCollection } = initQino({
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
      pages: { index: "/", entry: "/notes/{slug}", llmsFull: false },
    });
  });

  test("reject paths without a leading /", () => {
    defineCollection({
      directory: "notes",
      schema: z.object({}),
      extension: ".md",
      // @ts-expect-error: the index path starts with "/"
      pages: { index: "notes", entry: "/notes/{slug}" },
    });
  });

  test("reject an entry path without {slug}", () => {
    defineCollection({
      directory: "notes",
      schema: z.object({}),
      extension: ".md",
      // @ts-expect-error: the entry path contains {slug}
      pages: { index: "/notes", entry: "/notes" },
    });
  });
});

describe("getAgentMarkdown", () => {
  test("takes any string, and resolves to Markdown or null", () => {
    const slug: string = "from-a-route-param";

    expectTypeOf(postCollection.getAgentMarkdown(slug)).toEqualTypeOf<
      Promise<string | null>
    >();
  });

  test("takes a view the collection defines", () => {
    postCollection.getAgentMarkdown("hello", { view: "all" });
    // @ts-expect-error: no such view
    postCollection.getAgentMarkdown("hello", { view: "missing" });
  });
});

describe("getMarkdownUrl", () => {
  test("returns a URL", () => {
    expectTypeOf(
      postCollection.getMarkdownUrl("hello"),
    ).toEqualTypeOf<string>();
  });
});
