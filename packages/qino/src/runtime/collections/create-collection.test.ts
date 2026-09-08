import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

import { MARKDOWN_BODY_FIELD_NAME } from "../../data";
import { createQino } from "../qino/create-qino";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-collection-"));
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

describe("createCollection", () => {
  test("adds derived fields using the entry body and metadata", async () => {
    const posts = nodePath.join(tmp, "posts");
    await fs.mkdir(posts);
    await fs.writeFile(
      nodePath.join(posts, "hello.md"),
      ["---", "title: Hello", "---", "", "One two three"].join("\n"),
    );

    const qino = createQino({ contentFolder: tmp, mediaFolder: tmp });
    const collection = qino.createCollection({
      directory: "/posts",
      schema: z
        .object({ title: z.string(), [MARKDOWN_BODY_FIELD_NAME]: z.string() })
        .strict(),
      extension: ".md",
      augment: ({ body, _meta }) => ({
        words: body.trim().split(/\s+/u).length,
        sourceFile: _meta.fileName,
      }),
    });

    await expect(collection.getOne("hello")).resolves.toMatchObject({
      words: 3,
      sourceFile: "hello.md",
    });
  });
});
