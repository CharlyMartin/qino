import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

import { initQino } from "../../runtime/qino/init-qino";
import { collectImageManifest } from "./collect-image-manifest";

let tmp: string;
let contentFolder: string;
let mediaFolder: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-image-manifest-"));
  contentFolder = nodePath.join(tmp, "content");
  mediaFolder = nodePath.join(tmp, "public");
  for (const directory of ["posts", "docs", "pages"]) {
    await fs.mkdir(nodePath.join(contentFolder, directory), {
      recursive: true,
    });
  }
  await fs.mkdir(mediaFolder);
  const images = {
    "cover.webp": [32, 16],
    "a.png": [8, 4],
    "b.png": [4, 8],
    "my image.png": [6, 6],
    "doc.png": [10, 5],
    "banner.png": [12, 3],
  } as const;
  for (const [name, [width, height]] of Object.entries(images)) {
    await sharp({
      create: { width, height, channels: 3, background: "#000" },
    }).toFile(nodePath.join(mediaFolder, name));
  }
  await fs.writeFile(nodePath.join(mediaFolder, "guide.pdf"), "%PDF-1.7");
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

async function write(file: string, content: string) {
  await fs.writeFile(nodePath.join(contentFolder, file), content);
}

async function sizeOf(url: string) {
  return (await fs.stat(nodePath.join(mediaFolder, url))).size;
}

function setup() {
  const qino = initQino({ contentFolder, mediaFolder });
  const posts = qino.defineCollection({
    directory: "posts",
    extension: ".json",
    schema: z.object({
      cover: z.string(),
      hero: z.string().nullable(),
      gallery: z.array(z.string()),
      seo: z.object({ image: z.string() }),
      attachment: z.string(),
    }),
    media: {
      cover: { accepted: "image/webp", maxSize: "1MB" },
      hero: { accepted: "image/png", maxSize: "1MB" },
      "gallery[*]": { accepted: "image/png", maxSize: "1MB" },
      "seo.image": { accepted: "image/png", maxSize: "1MB" },
      attachment: { accepted: "application/pdf", maxSize: "1MB" },
    },
  });
  const docs = qino.defineTree({
    directory: "docs",
    extension: ".md",
    schema: z.object({ title: z.string(), image: z.string() }),
    titleField: "title",
    media: { image: { accepted: "image/png", maxSize: "1MB" } },
  });
  const home = qino.defineItem({
    file: "pages/home.md",
    schema: z.object({ banner: z.string() }),
    media: { banner: { accepted: "image/png", maxSize: "1MB" } },
  });

  return { posts, docs, home };
}

describe("collectImageManifest", () => {
  test("records each image of collections, trees, and items once, sorted by URL", async () => {
    const post = {
      cover: "/cover.webp",
      hero: null,
      gallery: ["/a.png", "/b.png"],
      seo: { image: "/my%20image.png" },
      attachment: "/guide.pdf",
    };
    await write("posts/one.json", JSON.stringify(post));
    await write(
      "posts/two.json",
      JSON.stringify({ ...post, hero: "/a.png", gallery: [] }),
    );
    await write("docs/intro.md", "---\ntitle: Intro\nimage: /doc.png\n---\n");
    await write("pages/home.md", "---\nbanner: /banner.png\n---\n");
    const { posts, docs, home } = setup();

    const manifest = await collectImageManifest(
      [posts, docs, home],
      mediaFolder,
    );

    expect(Object.keys(manifest ?? {})).toEqual([
      "/a.png",
      "/b.png",
      "/banner.png",
      "/cover.webp",
      "/doc.png",
      "/my image.png",
    ]);
    expect(manifest?.["/cover.webp"]).toEqual({
      size: await sizeOf("cover.webp"),
      width: 32,
      height: 16,
      blurDataURL: expect.stringMatching(/^data:image\/webp;base64,/u),
      blurWidth: 8,
      blurHeight: 4,
    });
    expect(manifest?.["/my image.png"]).toMatchObject({
      size: await sizeOf("my image.png"),
      width: 6,
      height: 6,
    });
    expect(manifest?.["/doc.png"]).toMatchObject({ width: 10, height: 5 });
    expect(manifest?.["/banner.png"]).toMatchObject({ width: 12, height: 3 });
  });

  test("is undefined without image fields", async () => {
    const qino = initQino({ contentFolder, mediaFolder });
    const files = qino.defineCollection({
      directory: "posts",
      extension: ".json",
      schema: z.object({ attachment: z.string() }),
      media: { attachment: { accepted: "application/pdf", maxSize: "1MB" } },
    });

    expect(await collectImageManifest([files], mediaFolder)).toBeUndefined();
    expect(await collectImageManifest([], mediaFolder)).toBeUndefined();
  });
});
