import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

import { MARKDOWN_BODY_FIELD_NAME } from "../data";
import { createQino } from "./qino/create-qino";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-transform-"));
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

const schema = z
  .object({
    title: z.string(),
    [MARKDOWN_BODY_FIELD_NAME]: z.string(),
  })
  .strict();

async function writeMarkdown(filePath: string, title: string, body: string) {
  await fs.mkdir(nodePath.dirname(filePath), { recursive: true });
  await fs.writeFile(
    filePath,
    ["---", `title: ${title}`, "---", "", body].join("\n"),
  );
}

describe("primitive transforms", () => {
  test("adds derived fields to collection, singleton, and tree entries", async () => {
    await writeMarkdown(
      nodePath.join(tmp, "posts", "hello.md"),
      "Hello",
      "One two three",
    );
    await writeMarkdown(
      nodePath.join(tmp, "pages", "home.md"),
      "Home",
      "One two",
    );
    await writeMarkdown(
      nodePath.join(tmp, "docs", "intro.md"),
      "Introduction",
      "One",
    );

    const qino = createQino({ contentFolder: tmp, mediaFolder: tmp });
    const collection = qino.createCollection({
      directory: "/posts",
      schema,
      extension: ".md",
      transform: ({ body, _meta }) => ({
        words: body.trim().split(/\s+/u).length,
        sourceFile: _meta.fileName,
      }),
    });
    const singleton = qino.createSingleton({
      file: "/pages/home.md",
      schema,
      transform: async ({ body }) => ({ words: body.trim().split(/\s+/u).length }),
    });
    const tree = qino.createTree({
      directory: "/docs",
      schema,
      extension: ".md",
      titleField: "title",
      transform: ({ body }) => ({ words: body.trim().split(/\s+/u).length }),
    });

    await expect(collection.getOne("hello")).resolves.toMatchObject({
      words: 3,
      sourceFile: "hello.md",
    });
    await expect(singleton.getData()).resolves.toMatchObject({ words: 2 });
    await expect(tree.getEntry("intro")).resolves.toMatchObject({ words: 1 });

    const [node] = await tree.getTree();
    expect(node).not.toHaveProperty("words");
  });
});
