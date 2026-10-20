import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

import { initQino } from "../runtime/qino/init-qino";

let tmp: string;
let contentFolder: string;
let mediaFolder: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-media-int-"));
  contentFolder = nodePath.join(tmp, "content");
  mediaFolder = nodePath.join(tmp, "public");
  await fs.mkdir(nodePath.join(contentFolder, "posts"), { recursive: true });
  await fs.mkdir(nodePath.join(contentFolder, "authors"));
  await fs.mkdir(mediaFolder);
  await sharp({
    create: { width: 32, height: 16, channels: 3, background: "#00f" },
  }).toFile(nodePath.join(mediaFolder, "cover.webp"));
  await sharp({
    create: { width: 8, height: 8, channels: 3, background: "#0f0" },
  }).toFile(nodePath.join(mediaFolder, "jane.png"));
  await fs.writeFile(
    nodePath.join(contentFolder, "authors", "jane.json"),
    JSON.stringify({ name: "Jane", avatar: "/jane.png" }),
  );
  await fs.writeFile(
    nodePath.join(contentFolder, "posts", "hello.md"),
    "---\ntitle: Hello\ncover: /cover.webp\nauthor: authors/jane.json\nfile: /doc.pdf\n---\n\nBody",
  );
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

function setup() {
  const qino = initQino({ contentFolder, mediaFolder });
  const authors = qino.defineCollection({
    directory: "authors",
    extension: ".json",
    schema: z.object({ name: z.string(), avatar: z.string() }),
    media: { avatar: { accepted: "image/png", maxSize: "1MB" } },
  });
  const posts = qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema: z.object({
      title: z.string(),
      cover: z.string(),
      author: z.string(),
      file: z.string(),
    }),
    relations: { author: authors },
    media: {
      cover: { accepted: "image/webp", maxSize: "5MB" },
      file: { accepted: "application/pdf", maxSize: "5MB" },
    },
    views: (view) => ({ default: view({ resolveRelations: 1 }) }),
  });

  return { authors, posts };
}

describe("media", () => {
  test("reads image fields as QinoImage, in related entries too", async () => {
    const post = await setup().posts.getEntry("hello");

    expect(post.cover).toMatchObject({
      src: "/cover.webp",
      width: 32,
      height: 16,
      blurWidth: 8,
      blurHeight: 4,
      blurDataURL: expect.stringMatching(/^data:image\/webp;base64,/u),
    });
    expect(post.author.avatar).toMatchObject({
      src: "/jane.png",
      width: 8,
      height: 8,
    });
    expect(post.file).toBe("/doc.pdf");
  });

  test("fails reading an image field outside mediaFolder", async () => {
    await fs.writeFile(
      nodePath.join(contentFolder, "authors", "jane.json"),
      JSON.stringify({ name: "Jane", avatar: "https://example.com/jane.png" }),
    );

    await expect(setup().authors.getEntry("jane")).rejects.toThrow(
      'media "avatar" must be a URL in mediaFolder',
    );
  });

  test("throws at definition on a media path that is a relation", () => {
    const qino = initQino({ contentFolder, mediaFolder });
    const { authors } = setup();

    expect(() =>
      qino.defineCollection({
        directory: "posts",
        extension: ".md",
        schema: z.object({ author: z.string() }),
        relations: { author: authors },
        media: { author: { accepted: "image/png", maxSize: "1MB" } },
      }),
    ).toThrow('media "author" of "posts" is also a relation.');
  });
});
