import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

import { initQino } from "../runtime/qino/init-qino";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-stats-int-"));
  await fs.mkdir(nodePath.join(tmp, "posts"));
  await fs.mkdir(nodePath.join(tmp, "authors"));
  await fs.mkdir(nodePath.join(tmp, "docs"));
  await fs.writeFile(
    nodePath.join(tmp, "authors", "jane.md"),
    "---\nname: Jane\n---\n\nJane writes.",
  );
  await fs.writeFile(
    nodePath.join(tmp, "posts", "hello.md"),
    "---\ntitle: Hello\nauthor: authors/jane.md\n---\n\nHello there world",
  );
  await fs.writeFile(
    nodePath.join(tmp, "docs", "intro.mdx"),
    "---\ntitle: Intro\n---\n\nOne two",
  );
  await fs.writeFile(nodePath.join(tmp, "about.md"), "---\n---\n\nAbout us");
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

function setup() {
  const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
  const authors = qino.defineCollection({
    directory: "authors",
    extension: ".md",
    schema: z.object({ name: z.string() }),
    markdownStats: true,
  });
  const posts = qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema: z.object({ title: z.string(), author: z.string() }),
    relations: { author: authors },
    markdownStats: true,
    views: (view) => ({
      default: view({ resolveRelations: 1 }),
      reading: view({
        augment: (post) => ({
          readingMinutes: Math.ceil(post._stats.wordCount / 220),
        }),
      }),
    }),
  });

  return { qino, authors, posts };
}

describe("markdownStats", () => {
  test("adds _stats to entries and related entries", async () => {
    const post = await setup().posts.getEntry("hello");

    expect(post._stats).toEqual({
      wordCount: 3,
      proseCharacterCount: 17,
      sourceCharacterCount: 18,
    });
    expect(post.author._stats.wordCount).toBe(2);
  });

  test("gives augment the stats", async () => {
    const post = await setup().posts.getEntry("hello", { view: "reading" });

    expect(post.readingMinutes).toBe(1);
  });

  test("applies to items and trees", async () => {
    const { qino } = setup();
    const about = qino.defineItem({
      file: "about.md",
      schema: z.object({}),
      markdownStats: true,
    });
    const docs = qino.defineTree({
      directory: "docs",
      extension: ".mdx",
      schema: z.object({ title: z.string() }),
      titleField: "title",
      markdownStats: true,
    });

    expect((await about.getEntry())._stats.wordCount).toBe(2);
    expect((await docs.getEntry("intro"))._stats.wordCount).toBe(2);
  });

  test("leaves entries without _stats when off", async () => {
    const { qino } = setup();
    const authors = qino.defineCollection({
      directory: "authors",
      extension: ".md",
      schema: z.object({ name: z.string() }),
    });

    expect(await authors.getEntry("jane")).not.toHaveProperty("_stats");
  });

  test("rejects JSON primitives", () => {
    const { qino } = setup();

    expect(() =>
      qino.defineCollection({
        directory: "authors",
        extension: ".json",
        schema: z.object({ name: z.string() }),
        // @ts-expect-error JSON files have no Markdown body.
        markdownStats: true,
      }),
    ).toThrow("JSON files have none");
  });
});
