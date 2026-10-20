import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

import { initQino } from "../../runtime/qino/init-qino";
import { findMediaViolations } from "./find-media-violations";

let tmp: string;
let contentFolder: string;
let mediaFolder: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-media-rules-"));
  contentFolder = nodePath.join(tmp, "content");
  mediaFolder = nodePath.join(tmp, "public");
  await fs.mkdir(nodePath.join(contentFolder, "posts"), { recursive: true });
  await fs.mkdir(mediaFolder);
  for (const name of ["a.webp", "b.png", "c.jpg", "a#b.png"]) {
    await sharp({
      create: { width: 4, height: 4, channels: 3, background: "#000" },
    }).toFile(nodePath.join(mediaFolder, name));
  }
  // Noise compresses badly, so this PNG is well over 50KB.
  const noise = crypto.getRandomValues(new Uint8Array(140 * 140 * 3));
  await sharp(Buffer.from(noise), {
    raw: { width: 140, height: 140, channels: 3 },
  })
    .png()
    .toFile(nodePath.join(mediaFolder, "large.png"));
  await fs.writeFile(nodePath.join(mediaFolder, "doc.pdf"), "%PDF-1.7");
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

function setup() {
  const qino = initQino({ contentFolder, mediaFolder });

  return qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema: z.object({
      cover: z.string(),
      attachment: z.string().optional(),
    }),
    media: {
      cover: { accepted: "image/webp", maxSize: "1MB" },
      attachment: { accepted: "application/pdf", maxSize: "50KB" },
      markdown: [
        { accepted: "image/webp", maxSize: "1MB" },
        { accepted: "image/png", maxSize: "50KB" },
      ],
    },
  });
}

async function writePost(frontmatter: string, body = "") {
  const file = nodePath.join(contentFolder, "posts", "a.md");
  await fs.writeFile(file, `---\n${frontmatter}\n---\n\n${body}`);
  return file;
}

describe("findMediaViolations", () => {
  test("finds nothing when every file follows the rules", async () => {
    await writePost(
      "cover: /a.webp\nattachment: /doc.pdf",
      "![](/a.webp)\n\n![](/b.png)\n\n[Not an image](/c.jpg)",
    );

    expect(await findMediaViolations(setup(), mediaFolder)).toEqual([]);
  });

  test("reads types from URLs with a query, hash, or encoded name", async () => {
    await writePost(
      "cover: /a.webp?v=1\nattachment: /doc.pdf#page=2",
      "![](/a%23b.png)\n\n![](/b.png?v=2)",
    );

    expect(await findMediaViolations(setup(), mediaFolder)).toEqual([]);
  });

  test("checks field types and sizes", async () => {
    const file = await writePost("cover: /a.webp\nattachment: /b.png");

    expect(await findMediaViolations(setup(), mediaFolder)).toEqual([
      {
        file,
        location: "attachment",
        url: "/b.png",
        reason: "is image/png, but only application/pdf is accepted.",
      },
    ]);
  });

  test("checks other fields are local files", async () => {
    await writePost("cover: /a.webp\nattachment: https://example.com/a.pdf");

    expect(await findMediaViolations(setup(), mediaFolder)).toMatchObject([
      {
        location: "attachment",
        reason: 'must be a URL in mediaFolder, starting with "/".',
      },
    ]);

    await writePost("cover: /a.webp\nattachment: /missing.pdf");

    expect(await findMediaViolations(setup(), mediaFolder)).toMatchObject([
      { location: "attachment", reason: `doesn't exist in "${mediaFolder}".` },
    ]);
  });

  test("checks body images against every rule", async () => {
    const file = await writePost(
      "cover: /a.webp",
      "![](/c.jpg)\n\n![](/large.png)",
    );

    expect(await findMediaViolations(setup(), mediaFolder)).toEqual([
      {
        file,
        location: "line 5",
        url: "/c.jpg",
        reason: "is image/jpeg, but only image/webp, image/png are accepted.",
      },
      {
        file,
        location: "line 7",
        url: "/large.png",
        reason: expect.stringMatching(/^is \d+KB, over the 50KB limit\.$/u),
      },
    ]);
  });

  test("skips primitives without media", async () => {
    const qino = initQino({ contentFolder, mediaFolder });
    const posts = qino.defineCollection({
      directory: "posts",
      extension: ".md",
      schema: z.object({ cover: z.string() }),
    });
    await writePost("cover: https://example.com/a.png");

    expect(await findMediaViolations(posts, mediaFolder)).toEqual([]);
  });

  test("throws on invalid media config", async () => {
    const qino = initQino({ contentFolder, mediaFolder });
    const posts = qino.defineCollection({
      directory: "posts",
      extension: ".md",
      schema: z.object({ cover: z.string() }),
      media: { markdown: [{ accepted: "image/*", maxSize: "1MB" }] },
    });

    await expect(findMediaViolations(posts, mediaFolder)).rejects.toThrow(
      'media "markdown" of "posts", rule 1, accepts "image/*", which isn\'t a known MIME type.',
    );
  });
});
