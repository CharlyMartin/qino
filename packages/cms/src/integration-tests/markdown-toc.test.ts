import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

import { initQino } from "../runtime/qino/init-qino";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-toc-int-"));
  await fs.mkdir(nodePath.join(tmp, "posts"));
  await fs.mkdir(nodePath.join(tmp, "authors"));
  await fs.mkdir(nodePath.join(tmp, "docs"));
  await fs.writeFile(
    nodePath.join(tmp, "authors", "jane.md"),
    "---\nname: Jane\n---\n\n## Bio",
  );
  await fs.writeFile(
    nodePath.join(tmp, "posts", "hello.md"),
    "---\ntitle: Hello\nauthor: authors/jane.md\n---\n\n## Intro\n\n### Details\n\n## Outro",
  );
  await fs.writeFile(
    nodePath.join(tmp, "docs", "intro.mdx"),
    "---\ntitle: Intro\n---\n\n## Install",
  );
  await fs.writeFile(nodePath.join(tmp, "about.md"), "---\n---\n\n## Team");
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
    markdownToc: true,
  });
  const posts = qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema: z.object({ title: z.string(), author: z.string() }),
    relations: { author: authors },
    markdownToc: true,
    views: (view) => ({
      default: view({}),
      outline: view({
        augment: (post) => ({ sectionCount: post._toc.length }),
      }),
    }),
  });

  return { qino, authors, posts };
}

describe("markdownToc", () => {
  test("adds _toc to entries and related entries", async () => {
    const post = await setup().posts.getEntry("hello");

    expect(post._toc).toEqual([
      { heading: 2, id: "intro", text: "Intro" },
      { heading: 3, id: "details", text: "Details" },
      { heading: 2, id: "outro", text: "Outro" },
    ]);
    expect(post.author._toc).toEqual([{ heading: 2, id: "bio", text: "Bio" }]);
  });

  test("gives augment the table of contents", async () => {
    const post = await setup().posts.getEntry("hello", { view: "outline" });

    expect(post.sectionCount).toBe(3);
  });

  test("stops at upTo", async () => {
    const { qino } = setup();
    const posts = qino.defineCollection({
      directory: "posts",
      extension: ".md",
      schema: z.object({ title: z.string(), author: z.string() }),
      markdownToc: { upTo: "h2" },
    });

    expect((await posts.getEntry("hello"))._toc.map(({ id }) => id)).toEqual([
      "intro",
      "outro",
    ]);
  });

  test("uses {#id} and slug", async () => {
    await fs.writeFile(
      nodePath.join(tmp, "docs", "ids.mdx"),
      "---\ntitle: Ids\n---\n\n## Install {#Setup}\n\n## `watch`: <TypeText>T</TypeText>",
    );
    const { qino } = setup();
    const docs = qino.defineTree({
      directory: "docs",
      extension: ".mdx",
      schema: z.object({ title: z.string() }),
      titleField: "title",
      markdownToc: { slug: (text) => text.replace(/[^a-zA-Z0-9]/g, "") },
    });

    expect((await docs.getEntry("ids"))._toc).toEqual([
      { heading: 2, id: "Setup", text: "Install" },
      { heading: 2, id: "watch", text: "watch:" },
    ]);
  });

  test("applies to items and trees", async () => {
    const { qino } = setup();
    const about = qino.defineItem({
      file: "about.md",
      schema: z.object({}),
      markdownToc: true,
    });
    const docs = qino.defineTree({
      directory: "docs",
      extension: ".mdx",
      schema: z.object({ title: z.string() }),
      titleField: "title",
      markdownToc: { upTo: "h3" },
    });

    expect((await about.getEntry())._toc[0]?.id).toBe("team");
    expect((await docs.getEntry("intro"))._toc[0]?.id).toBe("install");
  });

  test("leaves entries without _toc when off", async () => {
    const { qino } = setup();
    const authors = qino.defineCollection({
      directory: "authors",
      extension: ".md",
      schema: z.object({ name: z.string() }),
    });

    expect(await authors.getEntry("jane")).not.toHaveProperty("_toc");
  });

  test("rejects JSON primitives", () => {
    const { qino } = setup();

    expect(() =>
      qino.defineCollection({
        directory: "authors",
        extension: ".json",
        schema: z.object({ name: z.string() }),
        // @ts-expect-error JSON files have no Markdown headings.
        markdownToc: true,
      }),
    ).toThrow("JSON files have none");
  });
});
